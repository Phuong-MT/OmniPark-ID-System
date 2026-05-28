#include "pairManager.h"
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include "secrets.h"

PairingHandler::PairingHandler(MqttConfig &mqttRef, const String &type, OledDisplay &entryOledRef, OledDisplay &exitOledRef)
    : mqtt(mqttRef), deviceType(type), state(PairingState::BOOT), entryOled(entryOledRef), exitOled(exitOledRef)
{
    macAddress = String((uint32_t)ESP.getEfuseMac(), HEX);
    macAddress.toUpperCase();
}

void PairingHandler::begin()
{
    prefs.begin("pairing", false);
    pairToken = prefs.getString("token", "");

    if (pairToken.length() > 0)
    {
        state = PairingState::ACTIVE;
        Serial.println("[Pairing] Already paired with token: " + pairToken);
    }
    else
    {
        state = PairingState::PAIRING;
        generateSectionId();
        countdownSeconds = 300; // 5 minutes
        lastPublishMs = 0;
        lastCountdownUpdateMs = millis();
        Serial.println("[Pairing] Not paired. Starting pairing mode...");
        Serial.println("[Pairing] Session ID: " + sectionId);
    }

    // Register MQTT handler for pairing confirmation from the server
    String confirmTopic = "iot/device/" + macAddress + "/pair-confirm";
    mqtt.registerHandler(confirmTopic.c_str(), [this](const char *t, const uint8_t *p, unsigned int l)
                         { this->handlePairConfirm(t, p, l); });
}

void PairingHandler::loop()
{
    if (state != PairingState::PAIRING)
        return;

    if (!mqtt.connected())
        return;

    unsigned long now = millis();

    // Publish/refresh pairing request every 60 seconds (or immediately on startup)
    if (lastPublishMs == 0 || now - lastPublishMs >= 60000)
    {
        publishPairRequest();
    }

    // Update countdown and OLED displays every 1 second
    if (now - lastCountdownUpdateMs >= 1000)
    {
        lastCountdownUpdateMs = now;
        countdownSeconds--;

        entryOled.showPairing(macAddress, sectionId, countdownSeconds);
        exitOled.showPairing(macAddress, sectionId, countdownSeconds);

        if (countdownSeconds <= 0)
        {
            Serial.println("[Pairing] Session expired. Regenerating session...");
            generateSectionId();
            countdownSeconds = 300;
            publishPairRequest();
        }
    }
}

void PairingHandler::generateSectionId()
{
    // Generate a random 6-digit session ID
    sectionId = String(random(100000, 999999));
}

void PairingHandler::publishPairRequest()
{
    Serial.println("[Pairing] Publishing pair request to MQTT...");

    StaticJsonDocument<256> doc;
    doc["mac"] = macAddress;
    doc["sectionId"] = sectionId;
    doc["type"] = deviceType;

    char buffer[256];
    serializeJson(doc, buffer);

    mqtt.publish("iot/pair-request", buffer);
    lastPublishMs = millis();
}

void PairingHandler::handlePairConfirm(const char *topic, const uint8_t *payload, unsigned int length)
{
    Serial.println("[Pairing] Received pair confirm payload from MQTT");

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    if (error)
    {
        Serial.print("[Pairing] JSON Deserialization error: ");
        Serial.println(error.c_str());
        return;
    }

    const char *objectId = doc["objectId"];
    const char *token = doc["token"];

    if (objectId && token)
    {
        String recvToken = String(token);
        if (recvToken == sectionId)
        {
            Serial.println("[Pairing] Token matches. Sending HTTP confirmation to server...");
            sendHttpConfirm(objectId, recvToken);
        }
        else
        {
            Serial.println("[Pairing] Token mismatch. Recv: " + recvToken + ", Expected: " + sectionId);
        }
    }
}

void PairingHandler::sendHttpConfirm(const String &objectId, const String &token)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("[Pairing] HTTP Confirm failed: WiFi disconnected");
        return;
    }

    HTTPClient http;
    String url = String(BACKEND_HTTP_URL) + "/devices/pair-confirm";

    Serial.println("[Pairing] Connecting to: " + url);
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["mac"] = macAddress;
    doc["objectId"] = objectId;
    doc["token"] = token;

    String jsonBody;
    serializeJson(doc, jsonBody);

    int httpResponseCode = http.POST(jsonBody);

    if (httpResponseCode == 200 || httpResponseCode == 201)
    {
        String response = http.getString();
        Serial.println("[Pairing] HTTP Confirmation success: " + response);

        // Save pair status and token to preferences
        pairToken = token;
        prefs.putString("token", pairToken);
        state = PairingState::ACTIVE;

        // Show Success screen on OLEDs
        entryOled.showMessage("PAIR SUCCESS", 2, true);
        exitOled.showMessage("PAIR SUCCESS", 2, true);
        delay(3000);

        // Reset screens to Idle
        entryOled.showIdle();
        exitOled.showIdle();
    }
    else
    {
        Serial.print("[Pairing] HTTP POST failed, code: ");
        Serial.println(httpResponseCode);
        String response = http.getString();
        Serial.println("[Pairing] Response: " + response);
    }
    http.end();
}
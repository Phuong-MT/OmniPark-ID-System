#include "pairManager.h"
#include <ArduinoJson.h>

PairingHandler::PairingHandler(MqttConfig& mqttRef, const String& type, const String& code)
    : mqtt(mqttRef), deviceType(type), tenantCode(code), state(PairingState::BOOT) {
    macAddress = WiFi.macAddress();
    macAddress.toUpperCase();
}

void PairingHandler::begin() {
    prefs.begin("pairing", false);
    pairToken = prefs.getString("token", "");

    if (pairToken.length() > 0) {
        state = PairingState::ACTIVE;
        Serial.println("[Pairing] Already paired with token: " + pairToken);
    } else {
        state = PairingState::DISCOVERING;
        Serial.println("[Pairing] Not paired. Starting discovery...");
    }

    // Register MQTT handlers
    String tokenTopic = "iot/" + tenantCode + "/" + deviceType + "/" + macAddress + "/pair-token";
    mqtt.registerHandler(tokenTopic.c_str(), [this](const char* t, const uint8_t* p, unsigned int l) {
        this->handlePairToken(t, p, l);
    });

    String statusTopic = "iot/" + tenantCode + "/" + deviceType + "/" + macAddress + "/pair-status";
    mqtt.registerHandler(statusTopic.c_str(), [this](const char* t, const uint8_t* p, unsigned int l) {
        this->handlePairStatus(t, p, l);
    });

    udp.begin(UDP_PORT);
}

void PairingHandler::loop() {
    if (state == PairingState::DISCOVERING) {
        sendDiscoveryBroadcast();
    } else if (state == PairingState::ACTIVE && deviceType == "GATE") {
        listenForDiscovery();
    }
}

void PairingHandler::sendDiscoveryBroadcast() {
    if (millis() - lastBroadcastMs < 5000) return;
    lastBroadcastMs = millis();

    Serial.println("[Pairing] Sending discovery broadcast...");
    
    StaticJsonDocument<128> doc;
    doc["mac"] = macAddress;
    doc["type"] = deviceType;
    
    char buffer[128];
    serializeJson(doc, buffer);

    IPAddress broadcastIP(255, 255, 255, 255);
    udp.beginPacket(broadcastIP, UDP_PORT);
    udp.write((const uint8_t*)buffer, strlen(buffer));
    udp.endPacket();
}

void PairingHandler::listenForDiscovery() {
    int packetSize = udp.parsePacket();
    if (packetSize) {
        char buffer[256];
        int len = udp.read(buffer, 255);
        if (len > 0) buffer[len] = 0;

        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, buffer);
        if (error) return;

        const char* clientMac = doc["mac"];
        const char* clientType = doc["type"];
        
        if (clientMac && clientType) {
            forwardToMqtt(clientMac, clientType);
        }
    }
}

void PairingHandler::forwardToMqtt(const String& clientMac, const String& clientType) {
    Serial.println("[Pairing] Forwarding discovery for: " + clientMac);
    
    // Topic: iot/:tenantCode/:gwType/:gwId/pair-forward
    String clientId = "GATE_" + macAddress.substring(macAddress.length() - 5);
    String topic = "iot/" + tenantCode + "/" + deviceType + "/" + clientId + "/pair-forward";
    
    StaticJsonDocument<128> doc;
    doc["macAddress"] = clientMac;
    doc["type"] = clientType;
    
    char buffer[128];
    serializeJson(doc, buffer);
    mqtt.publish(topic.c_str(), buffer);
}

void PairingHandler::handlePairToken(const char* topic, const uint8_t* payload, unsigned int length) {
    Serial.println("[Pairing] Received pair token");
    
    StaticJsonDocument<256> doc;
    deserializeJson(doc, payload, length);
    
    const char* token = doc["pairToken"];
    if (token) {
        pairToken = String(token);
        state = PairingState::WAITING_ACTIVATION;
        
        // Send activation request
        String actTopic = "iot/" + tenantCode + "/" + deviceType + "/" + macAddress + "/pair-activate";
        StaticJsonDocument<128> actDoc;
        actDoc["token"] = pairToken;
        char buffer[128];
        serializeJson(actDoc, buffer);
        mqtt.publish(actTopic.c_str(), buffer);
    }
}

void PairingHandler::handlePairStatus(const char* topic, const uint8_t* payload, unsigned int length) {
    StaticJsonDocument<128> doc;
    deserializeJson(doc, payload, length);
    
    if (String(doc["status"] | "") == "ACTIVE") {
        Serial.println("[Pairing] Device activated!");
        prefs.putString("token", pairToken);
        state = PairingState::ACTIVE;
    }
}
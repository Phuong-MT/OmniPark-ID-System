#include "_core/device_info.h"
#include "config/mqtt_config.h"
#include "config/wifi_config.h"
#include "handshake/handshake.h"
#include "pairManager/pairManager.h"
#include "rfid/RFIDScanner.h"
#include <Arduino.h>
#include <ArduinoJson.h>
#include <ctime>
#include <string>

using namespace std;

#define LED_PIN 2

WifiConfig wifi;
WiFiClient net;
MqttConfig mqtt(net);
DeviceInfo &deviceInfo = DeviceInfo::getInstance();

String clientId = "ESP32_GATE_" + String((uint32_t)ESP.getEfuseMac(), HEX);
String macStr = String((uint32_t)ESP.getEfuseMac(), HEX);
HandshakeManager hs(clientId.c_str(), macStr.c_str());

PairingHandler pairing(
    mqtt, "GATE",
    "OMNIPARK_DEMO"); // Hardcoded tenant for now, should come from config

RFIDScanner rfidScanner(5, 21); // SS pin 5, RST pin 21

void onCardScanned(const String &cardId)
{
    Serial.println("Card scanned: " + cardId);

    StaticJsonDocument<128> doc;
    doc["mac"] = macStr.c_str();
    doc["card_id"] = cardId.c_str();
    doc["timestamp"] = std::time(nullptr);

    char buffer[128];
    serializeJson(doc, buffer);
    Serial.println(buffer);
    String topic = "iot/gate/" + macStr + "/rfid";
    mqtt.publish(topic.c_str(), buffer);
}

unsigned long lastHandshakeMs = 0;
const unsigned long HANDSHAKE_INTERVAL = 20000; // 20s

unsigned long lastHeartbeatMs = 0;
const unsigned long HEARTBEAT_INTERVALS[] = {60000, 120000,
                                             300000}; // 1m, 2m, 5m
int currentHeartbeatIndex = 0;

void setup()
{
    Serial.begin(115200);
    Serial.println("ESP32 Gate Controller Booting...");
    Serial.println("Client ID: " + clientId);

    pinMode(LED_PIN, OUTPUT);

    delay(1000);
    wifi.begin();
    while (!wifi.connected())
    {
        Serial.println("Waiting for WiFi connection...");
        delay(2000);
    }
    NetworkInfo net = wifi.get();

    if (!net.connected)
    {
        Serial.println("WiFi not connected!");
        return;
    };

    Serial.println("WiFi Connected!");
    Serial.print("SSID: ");
    Serial.println(net.ssid);
    Serial.print("BSSID: ");
    Serial.println(net.bssid);
    Serial.print("IP Address: ");
    Serial.println(net.ip);
    Serial.print("Gateway: ");
    Serial.println(net.gateway);
    Serial.print("RSSI: ");
    Serial.println(net.rssi);

    Serial.println("Setup wifi completed.");

    // register handle callback message broker
    mqtt.registerHandler(
        HANDSHAKE_TOPIC_RESPONSE(macStr.c_str()).c_str(),
        [&](const char *, const uint8_t *payload, unsigned int length)
        {
            Serial.println("Handshake ack");
            string msg((char *)payload, length);
            if (hs.handleResponsePayload(msg))
            {
                Serial.println("[HS] Handshake OK");
            }
            else
            {
                Serial.println("[HS] Handshake Failed");
            }
        });

    // pairing.begin();
    mqtt.begin();

    rfidScanner.setCallback(onCardScanned);
    rfidScanner.begin();
}

void loop()
{
    mqtt.loop();
    rfidScanner.loop();

    if (!wifi.connected())
        return;

    unsigned long now = millis();

    if (!hs.hasValidSession(std::time(nullptr)) &&
        now - lastHandshakeMs > HANDSHAKE_INTERVAL)
    {

        Serial.println("[HS] Sending handshake...");

        NetworkInfo net = wifi.get();
        std::string payload = hs.buildRequestPayload(
            net.ssid.c_str(), net.subnetMask.c_str(), net.ip.toString().c_str());

        mqtt.publish(HANDSHAKE_TOPIC_REQUEST, payload.c_str());

        lastHandshakeMs = now;
        return;
    }

    // if (!pairing.isPaired() && hs.hasValidSession(time(nullptr)) &&
    // deviceInfo.getPairing() == DevicePairState::PAIRING){
    //   pairing.loop();
    //   return;
    // }

    // Heartbeat after handshake
    if (hs.hasValidSession(std::time(nullptr)) &&
        now - lastHeartbeatMs > HEARTBEAT_INTERVALS[currentHeartbeatIndex])
    {
        Serial.println("[Heartbeat] Sending...");

        String topic = "iot/heartbeat/" + macStr;
        StaticJsonDocument<128> doc;

        doc["mac"] = macStr.c_str();

        char buffer[128];
        serializeJson(doc, buffer);
        mqtt.publish(topic.c_str(), buffer);

        lastHeartbeatMs = now;
        currentHeartbeatIndex = (currentHeartbeatIndex + 1) % 3;
    }
}

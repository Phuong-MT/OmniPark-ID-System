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
#include "display/OledDisplay.h"
#include "servo/GateServo.h"
#include "_core/gate_type.h"

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

String lastCartId = "";

#define SS_PIN_ENTRY 5
#define SS_PIN_EXIT 4
#define RST_PIN_ENTRY 21
#define RST_PIN_EXIT 22
#define I2C_SDA_PIN_ENTRY 17
#define I2C_SCL_PIN_ENTRY 16

// Cấu hình chân I2C cho OLED Exit (Hãy đổi lại cho đúng với phần cứng của bạn)
#define I2C_SDA_PIN_EXIT 14
#define I2C_SCL_PIN_EXIT 13

#define SERVO_PIN_ENTRY 25
#define SERVO_PIN_EXIT 26

RFIDScanner entryScanner(GateType::ENTRY, SS_PIN_ENTRY, RST_PIN_ENTRY);
RFIDScanner exitScanner(GateType::EXIT, SS_PIN_EXIT, RST_PIN_EXIT);

OledDisplay entryOled(GateType::ENTRY, &Wire, 0x3C);
// Khởi tạo exitOled dùng Wire1, địa chỉ thường là 0x3C nếu nó khác bus I2C với entryOled
OledDisplay exitOled(GateType::EXIT, &Wire1, 0x3C);

GateServo entryServo(GateType::ENTRY, SERVO_PIN_ENTRY);
GateServo exitServo(GateType::EXIT, SERVO_PIN_EXIT);

void onCardScanned(GateType type, const String &cardId, bool isError)
{
    String gateName = (type == GateType::ENTRY) ? "ENTRY" : "EXIT";
    OledDisplay &targetOled = (type == GateType::ENTRY) ? entryOled : exitOled;
    GateServo &targetServo = (type == GateType::ENTRY) ? entryServo : exitServo;

    if (isError)
    {
        targetOled.showError();
        return;
    }

    targetOled.showGreeting(cardId);
    targetServo.open();

    Serial.println("[" + gateName + "] Card scanned: " + cardId);

    StaticJsonDocument<128> doc;
    doc["mac"] = macStr.c_str();
    doc["card_id"] = cardId.c_str();
    doc["gate"] = gateName.c_str();
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

    SPI.begin(18, 19, 23); // SCK, MISO, MOSI
    Wire.begin(I2C_SDA_PIN_ENTRY, I2C_SCL_PIN_ENTRY);
    Wire1.begin(I2C_SDA_PIN_EXIT, I2C_SCL_PIN_EXIT);

    entryOled.begin();
    exitOled.begin();

    entryScanner.setCallback(onCardScanned);
    entryScanner.begin();

    exitScanner.setCallback(onCardScanned);
    exitScanner.begin();

    entryServo.begin();
    exitServo.begin();
}

void loop()
{
    mqtt.loop();
    entryScanner.loop();
    exitScanner.loop();
    entryOled.loop();
    exitOled.loop();
    entryServo.loop();
    exitServo.loop();

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
    };
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
    };

    // pair devices
}

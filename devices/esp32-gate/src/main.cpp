#include <Arduino.h>
#include <ArduinoJson.h>
#include <string>
#include <ctime>
#include "config/wifi_config.h"
#include "config/mqtt_config.h"
#include "handshake/handshake.h"
#include "pairManager/pairManager.h"
#include "_core/device_info.h"

using namespace std;

#define LED_PIN 2

WifiConfig wifi;
WiFiClient net;
MqttConfig mqtt(net);
DeviceInfo& deviceInfo = DeviceInfo::getInstance();

String clientId = "ESP32_GATE_" + String((uint32_t)ESP.getEfuseMac(), HEX);
HandshakeManager hs(clientId.c_str(), String((uint32_t)ESP.getEfuseMac(), HEX).c_str());

PairingHandler pairing(mqtt, "GATE", "OMNIPARK_DEMO"); // Hardcoded tenant for now, should come from config

unsigned long lastHandshakeMs = 0;
const unsigned long HANDSHAKE_INTERVAL = 20000; // 20s


unsigned long lastHeartbeatMs = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30s

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Gate Controller Booting...");
  Serial.println("Client ID: "+ clientId);

  pinMode(LED_PIN, OUTPUT);

  delay(1000);
  wifi.begin();
  while(!wifi.connected()){
    Serial.println("Waiting for WiFi connection...");
    delay(2000);
  }
  NetworkInfo net = wifi.get();

  if(!net.connected){
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

  //register handle callback message broker
  mqtt.registerHandler(
    HANDSHAKE_TOPIC_RESPONSE(String((uint32_t)ESP.getEfuseMac(), HEX).c_str()).c_str(),
    [&](const char*, const uint8_t* payload, unsigned int length) {
      Serial.println("Handshake ack");
      string msg((char*)payload, length);

      if (hs.handleResponsePayload(msg)) {
        Serial.println("[HS] Handshake OK");
      }else{
        Serial.println("[HS] Handshake Failed");
      }
    }
  );


  pairing.begin();
  mqtt.begin();
}

void loop() {
  Serial.println("System Running...");
  
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
  
  mqtt.loop();

  if (!wifi.connected()) return;

  unsigned long now = millis();
  
  Serial.println("now: "+String(now));
  
  Serial.println("now: "+String(lastHandshakeMs));
  
  if (!hs.hasValidSession(std::time(nullptr)) &&
    now - lastHandshakeMs > HANDSHAKE_INTERVAL) {

    Serial.println("[HS] Sending handshake...");
    mqtt.publish(
        HANDSHAKE_TOPIC_REQUEST,
        hs.buildRequestPayload().c_str()
    );

    lastHandshakeMs = now;
    return ;
  }

  if (!pairing.isPaired() && hs.hasValidSession(time(nullptr)) && deviceInfo.getPairing() == DevicePairState::PAIRING){
    pairing.loop();
  }

  // Heartbeat after paired
  if (now - lastHeartbeatMs > HEARTBEAT_INTERVAL) {
    Serial.println("[Heartbeat] Sending...");
    
    String topic = "iot/OMNIPARK_DEMO/GATE/" + clientId + "/heartbeat";
    StaticJsonDocument<128> doc;
    doc["uptime"] = now / 1000;
    doc["ip"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();
    
    char buffer[128];
    serializeJson(doc, buffer);
    mqtt.publish(topic.c_str(), buffer);

    lastHeartbeatMs = now;
  }
}

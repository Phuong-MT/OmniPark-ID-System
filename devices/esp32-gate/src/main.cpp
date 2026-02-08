#include <Arduino.h>
#include "config/wifi_config.h"
#include "config/mqtt_config.h"
#include "handshake/handshake.h"
#include <string>
#include <ctime>

using namespace std;

#define LED_PIN 2

WifiConfig wifi;
WiFiClient net;
MqttConfig mqtt(net);

String clientId = "ESP32_GATE_" + String((uint32_t)ESP.getEfuseMac(), HEX);
HandshakeManager hs(clientId.c_str(), String((uint32_t)ESP.getEfuseMac(), HEX).c_str());

unsigned long lastHandshakeMs = 0;
const unsigned long HANDSHAKE_INTERVAL = 20000; // 20s

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
    "device/handshake/ack",
    [&](const char*, const uint8_t* payload, unsigned int length) {
      Serial.println("Handshake ack");
      std::string msg((char*)payload, length);

      if (hs.handleResponsePayload(msg)) {
        Serial.println("[HS] Handshake OK");
      }
    }
  );

  mqtt.begin();
}

void loop() {
  Serial.println("System Running...");
  

  digitalWrite(2, HIGH);
  delay(500);
  digitalWrite(2, LOW);
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
        "device/handshake/req",
        hs.buildRequestPayload().c_str()
    );

    lastHandshakeMs = now;
  }
}

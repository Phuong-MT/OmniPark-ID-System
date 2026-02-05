#include <Arduino.h>
#include "config/wifi_config.h"
#include "config/mqtt_config.h"

WifiConfig wifi;
WiFiClient net;
MqttConfig mqtt(net);

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Gate Controller Booting...");
  delay(1000);
  wifi.begin();
  while(!wifi.connected()){
    Serial.println("Waiting for WiFi connection...");
    delay(2000);
  }
  NetworkInfo net = wifi.get();

  if(net.connected){
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

    mqtt.begin();
  }else{
    Serial.println("WiFi not connected!");
  }
}

void loop() {
  Serial.println("System Running...");
  delay(2000);
  if (wifi.connected()) {
      mqtt.loop();
  }
}

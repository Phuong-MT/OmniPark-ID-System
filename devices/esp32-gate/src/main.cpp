#include <Arduino.h>
#include "config/wifi_config.h"

WifiConfig wifi;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Gate Controller Booting...");
  delay(1000);
  wifi.begin();
}

void loop() {
  Serial.println("System Running...");
  delay(10000);
}

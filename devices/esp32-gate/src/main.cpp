#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Gate Controller Booting...");
}

void loop() {
  Serial.println("System Running...");
  delay(1000);
}

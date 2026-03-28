#include "esp_camera.h"
#include <WiFi.h>
#include "camera_pins.h"
#include "config/wifi_config.h"

void startCameraServer();

WifiConfig wifi;
WiFiClient net;

void setup() {

  Serial.begin(115200);
  delay(3000);

  Serial.println("Booting...");

  // ===== CHECK PSRAM =====
  Serial.printf("PSRAM Size: %u\n", ESP.getPsramSize());
  Serial.printf("Free PSRAM: %u\n", ESP.getFreePsram());
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 10000000;
  config.pixel_format = PIXFORMAT_JPEG;

  config.frame_size = FRAMESIZE_QQVGA;
  config.jpeg_quality = 20;
  config.fb_count = 3;

  config.grab_mode = CAMERA_GRAB_LATEST;
  delay(2000);
  while (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera init failed");
    delay(2000);
  }

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
  startCameraServer();
}

void loop() {
  Serial.println("");
  Serial.print("Camera ready: http://");
  Serial.println(WiFi.localIP());
  delay(10000);
}
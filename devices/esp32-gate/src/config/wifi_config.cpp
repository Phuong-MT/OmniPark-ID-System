#include <WiFi.h>
#include "wifi_config.h"

#ifdef WIFI_TEST

// ===== DEV MODE =====
void WifiConfig::begin() {
    Serial.println("WIFI TEST MODE");

    const char* ssid = "Wokwi-GUEST";
    const char* pass = "abcelearning2024";

    WiFi.begin(ssid, pass);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nWiFi Connected (TEST)");
    Serial.println(WiFi.localIP());
}

#else

// ===== SETUP / PROD MODE =====
#include <WiFiManager.h>

void WifiConfig::begin() {
    Serial.println("WIFI MANAGER MODE");

    WiFiManager wm;
    bool res = wm.autoConnect("OmniPark-Setup");

    if (!res) {
        Serial.println("WiFi connect failed. Restarting...");
        delay(2000);
        ESP.restart();
    }

    Serial.println("WiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
}

#endif

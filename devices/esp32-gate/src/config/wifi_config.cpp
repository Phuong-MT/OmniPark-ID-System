#include <WiFi.h>
#include "wifi_config.h"

#ifdef WIFI_TEST

// ===== DEV MODE =====
void WifiConfig::begin() {
    Serial.println("WIFI TEST MODE");

    const char* ssid = "Wokwi-GUEST";
    const char* pass = "";

    WiFi.begin(ssid, pass);

    unsigned long start = millis();

    while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
        delay(500);
        Serial.print(".");
    }

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("\n[WiFi] TEST connect failed");
        return;
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
    wm.setConfigPortalTimeout(180);
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

bool WifiConfig::connected() {
    return WiFi.status() == WL_CONNECTED;
}

NetworkInfo WifiConfig::get() {
    NetworkInfo info;

    info.connected = (WiFi.status() == WL_CONNECTED);

    if (!info.connected) {
        return info;
    }

    info.ssid    = WiFi.SSID();
    info.bssid  = WiFi.BSSIDstr();
    info.ip     = WiFi.localIP();
    info.gateway= WiFi.gatewayIP();
    info.rssi   = WiFi.RSSI();

    return info;
}
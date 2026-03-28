#pragma once

#include <WiFi.h>
#include <WiFiManager.h>

inline std::string wifi_hostname(){
    String chipId = String((uint32_t)ESP.getEfuseMac(), HEX);
    chipId.toUpperCase();
    return std::string("OMNIPARK_GATE_") + chipId.substring(chipId.length() - 4).c_str();
};

#define WIFI_HOSTNAME wifi_hostname().c_str()
struct NetworkInfo {
    bool connected;
    String ssid;
    String bssid;
    IPAddress ip;
    IPAddress gateway;
    int rssi;
};

class WifiConfig {
    public:
        void begin();
        bool connected();
        NetworkInfo get();
    private:
    
};

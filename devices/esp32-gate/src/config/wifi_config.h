#pragma once

#include <WiFi.h>
#include <WiFiManager.h>

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

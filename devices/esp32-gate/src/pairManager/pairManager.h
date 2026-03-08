#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <Preferences.h>
#include "config/mqtt_config.h"

enum class PairingState {
    BOOT,
    DISCOVERING,
    WAITING_TOKEN,
    WAITING_ACTIVATION,
    ACTIVE
};

class PairingHandler {
public:
    PairingHandler(MqttConfig& mqtt, const String& type, const String& tenantCode);

    void begin();
    void loop();

    bool isPaired() const { return state == PairingState::ACTIVE; }
    PairingState getState() const { return state; }
    String getPairToken() const { return pairToken; }

private:
    void sendDiscoveryBroadcast();
    void listenForDiscovery();
    void handlePairToken(const char* topic, const uint8_t* payload, unsigned int length);
    void handlePairStatus(const char* topic, const uint8_t* payload, unsigned int length);
    void forwardToMqtt(const String& clientMac, const String& clientType);

    MqttConfig& mqtt;
    String deviceType;
    String tenantCode;
    String macAddress;
    String pairToken;
    PairingState state;
    
    WiFiUDP udp;
    Preferences prefs;
    unsigned long lastBroadcastMs = 0;
    const uint16_t UDP_PORT = 4444;
};
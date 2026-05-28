#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <Preferences.h>
#include "config/mqtt_config.h"
#include "display/OledDisplay.h"

enum class PairingState
{
    BOOT,
    PAIRING,
    ACTIVE
};

class PairingHandler
{
public:
    PairingHandler(MqttConfig &mqtt, const String &type, OledDisplay &entryOled, OledDisplay &exitOled);

    void begin();
    void loop();

    bool isPaired() const { return state == PairingState::ACTIVE; }
    PairingState getState() const { return state; }
    String getPairToken() const { return pairToken; }

private:
    void generateSectionId();
    void publishPairRequest();
    void handlePairConfirm(const char *topic, const uint8_t *payload, unsigned int length);
    void sendHttpConfirm(const String &objectId, const String &token);

    MqttConfig &mqtt;
    String deviceType;
    String macAddress;
    String pairToken;
    PairingState state;

    OledDisplay &entryOled;
    OledDisplay &exitOled;

    Preferences prefs;

    String sectionId;
    int countdownSeconds;
    unsigned long lastPublishMs;
    unsigned long lastCountdownUpdateMs;
};
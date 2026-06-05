#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include "config/mqtt_config.h"
#include "display/OledDisplay.h"
#include "_core/device_info.h"
class PairingHandler
{
public:
    PairingHandler(MqttConfig &mqtt, DeviceInfo &deviceInfo, const String &type, OledDisplay &entryOled, OledDisplay &exitOled);

    void begin();
    void loop();

    String getPairToken() const { return pairToken; }

private:
    void generateSectionId();
    void publishPairRequest();
    void handlePairConfirm(const char *topic, const uint8_t *payload, unsigned int length);
    void sendHttpConfirm(const String &objectId, const String &token);

    MqttConfig &mqtt;
    DeviceInfo &deviceInfo;
    String deviceType;
    String macAddress;
    String pairToken;

    OledDisplay &entryOled;
    OledDisplay &exitOled;

    String sectionId;
    int countdownSeconds;
    unsigned long lastPublishMs;
    unsigned long lastCountdownUpdateMs;
};
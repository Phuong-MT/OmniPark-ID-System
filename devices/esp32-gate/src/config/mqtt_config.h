#pragma once

#include <WiFi.h>
#include <PubSubClient.h>

class MqttConfig {
public:
    MqttConfig(Client& client);

    void begin();
    void loop();

    bool subscribe(const char* topic, uint8_t qos = 0);
    bool publish(const char* topic, const char* payload);

    bool connected();

private:
    PubSubClient mqtt;

    void reconnect();
    static void onMessage(char* topic, byte* payload, unsigned int length);
};

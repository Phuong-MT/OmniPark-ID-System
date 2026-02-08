#pragma once
#include <map>
#include <functional>
#include <PubSubClient.h>

using MqttHandler = std::function<void(
    const char* topic,
    const uint8_t* payload,
    unsigned int length
)>;

class MqttConfig {
public:
    MqttConfig(Client& client);

    void begin();
    void loop();
    void reconnect();

    bool subscribe(const char* topic, uint8_t qos = 0);
    bool publish(const char* topic, const char* payload);
    bool connected();

    void registerHandler(const char* topic, MqttHandler handler);

private:
    static void onMessage(char* topic, byte* payload, unsigned int length);

    static std::map<String, MqttHandler> handlers;
    PubSubClient mqtt;
    bool subscribed = false;
};

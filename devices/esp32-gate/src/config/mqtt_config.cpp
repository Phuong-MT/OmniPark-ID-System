#include "mqtt_config.h"
#include "secrets.h"

std::map<String, MqttHandler> MqttConfig::handlers;

MqttConfig::MqttConfig(Client& client)
    : mqtt(client) {}

void MqttConfig::begin() {
    mqtt.setServer(MQTT_HOST, MQTT_PORT);
    mqtt.setBufferSize(1024);
    mqtt.setCallback(MqttConfig::onMessage);
}

void MqttConfig::registerHandler(const char* topic, MqttHandler handler) {
    String topicStr = String(topic);
    handlers[topicStr] = handler;

    Serial.print("[MQTT] Register handler: ");
    Serial.println(topicStr);

    if (mqtt.connected()) {
        if (mqtt.subscribe(topic, 1)) {
            Serial.print("[MQTT] Subscribed immediately: ");
            Serial.println(topic);
        } else {
            Serial.print("[MQTT] Subscribe FAILED: ");
            Serial.println(topic);
        }
    }
}

void MqttConfig::onMessage(char* topic, byte* payload, unsigned int length) {
    Serial.print("[MQTT] [");
    Serial.print(topic);
    Serial.print("] => ");

    String msg = "";
    for (unsigned int i = 0; i < length; i++) {
        msg += (char)payload[i];
    }
    Serial.println(msg);
    auto it = handlers.find(String(topic));
    if (it != handlers.end()) {
        it->second(topic, payload, length);
    } else {
        Serial.println("[MQTT] No handler for this topic");
    }
}

void MqttConfig::loop() {
    if (!mqtt.connected()) {
        reconnect();
    }

    mqtt.loop();
}

void MqttConfig::reconnect() {
    String clientId = "ESP32_GATE_";
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

    String tenantCode = "OMNIPARK_DEMO";
    String lwtTopic = "iot/" + tenantCode + "/GATE/" + clientId + "/status";
    String lwtPayload = "{\"isOnline\": false, \"reason\": \"LWT\"}";

    while (!mqtt.connected()) {
        Serial.print("[MQTT] Connecting... ");

        if (mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS,
                         lwtTopic.c_str(), 1, true, lwtPayload.c_str())) {

            Serial.println("OK");

            // 🔥 Subscribe lại toàn bộ topic sau reconnect
            for (auto& it : handlers) {
                if (subscribe(it.first.c_str(), 1)) {
                    Serial.print("[MQTT] Resubscribed: ");
                    Serial.println(it.first);
                } else {
                    Serial.print("[MQTT] Resubscribe FAILED: ");
                    Serial.println(it.first);
                }
            }

            // Publish online status
            String onlinePayload = "{\"isOnline\": true}";
            mqtt.publish(lwtTopic.c_str(), onlinePayload.c_str(), true);
            // mqtt.subscribe("#", 1);
            Serial.println("[MQTT] Connected and online status published");
            delay(2000);
        } else {
            Serial.print("FAILED rc=");
            Serial.println(mqtt.state());
            delay(3000);
        }
    }
}

bool MqttConfig::subscribe(const char* topic, uint8_t qos) {
    if (!mqtt.connected()) return false;

    bool ok = mqtt.subscribe(topic, qos);
    if (ok) {
        Serial.print("[MQTT] Subscribed: ");
        Serial.println(topic);
    } else {
        Serial.print("[MQTT] Subscribe FAILED: ");
        Serial.println(topic);
    }
    return ok;
}

bool MqttConfig::publish(const char* topic, const char* payload) {
    if (!mqtt.connected()) return false;

    Serial.print("[MQTT] Publishing: ");
    Serial.println(topic);

    return mqtt.publish(topic, payload);
}

bool MqttConfig::connected() {
    return mqtt.connected();
}
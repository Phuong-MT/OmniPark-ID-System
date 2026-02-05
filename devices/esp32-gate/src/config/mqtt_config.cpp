#include "mqtt_config.h"
#include "secrets.h"

MqttConfig::MqttConfig(Client& client)
    : mqtt(client) {}

void MqttConfig::begin() {
    mqtt.setServer(MQTT_HOST, MQTT_PORT);
    mqtt.setCallback(MqttConfig::onMessage);
}

void MqttConfig::loop() {
    if (!mqtt.connected()) {
        reconnect();
    }
    mqtt.loop();
}

void MqttConfig::reconnect() {
    String clientId = "ESP32_TLV_";
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);
    while (!mqtt.connected()) {
        Serial.print("[MQTT] Connecting... ");

        if (mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
            Serial.println("OK");
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
    }
    return ok;
}

bool MqttConfig::publish(const char* topic, const char* payload) {
    if (!mqtt.connected()) return false;
    return mqtt.publish(topic, payload);
}

bool MqttConfig::connected() {
    return mqtt.connected();
}

void MqttConfig::onMessage(char* topic, byte* payload, unsigned int length) {
    Serial.print("[MQTT] ");
    Serial.print(topic);
    Serial.print(" => ");

    for (unsigned int i = 0; i < length; i++) {
        Serial.print((char)payload[i]);
    }
    Serial.println();
}

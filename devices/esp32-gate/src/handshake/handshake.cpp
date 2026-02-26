#include <ArduinoJson.h>
#include "handshake.h"
#include <ctime>

HandshakeManager::HandshakeManager(const std::string& deviceName, const std::string&macId)
    : device_name(deviceName), mac_id(macId) {}

std::string HandshakeManager::buildRequestPayload() const {

    StaticJsonDocument<300> doc;
    doc["type"] = "GATE";
    doc["device_name"] = device_name.c_str();
    doc["timestamp"] = (uint64_t)time(nullptr);
    doc["mac_id"] = mac_id.c_str();
    std::string out;
    serializeJson(doc, out);
    return out;
}

bool HandshakeManager::handleResponsePayload(const std::string& payload) {
    StaticJsonDocument<384> doc;
    DeserializationError err = deserializeJson(doc, payload);

    if (err) {
        session_token.clear();
        expires_at = 0;
        return false;
    }

    const char* status = doc["status"];
    if (!status || strcmp(status, "SUCCESS") != 0) {
        session_token.clear();
        expires_at = 0;
        return false;
    }

    session_token = doc["session_token"].as<const char*>();
    expires_at = doc["expires_at"].as<uint64_t>();

    return true;
}

bool HandshakeManager::hasValidSession(uint64_t now) const {
    return !session_token.empty() && now < expires_at;
}

const std::string& HandshakeManager::getSessionToken() const {
    return session_token;
}

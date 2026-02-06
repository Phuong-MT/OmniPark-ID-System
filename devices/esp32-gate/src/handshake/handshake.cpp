#include <ArduinoJson.h>
#include "handshake.h"
#include <ctime>

HandshakeManager::HandshakeManager(const std::string& deviceId)
    : device_id(deviceId) {}

std::string HandshakeManager::buildRequestPayload() const {
    // {
    //   "type": "handshake_request",
    //   "device_id": "...",
    //   "timestamp": 123456
    // }

    StaticJsonDocument<256> doc;
    doc["type"] = "handshake_request";
    doc["device_id"] = device_id.c_str();
    doc["timestamp"] = (uint64_t)time(nullptr);

    std::string out;
    serializeJson(doc, out);
    return out;
}

bool HandshakeManager::handleResponsePayload(const std::string& payload) {
    // {
    //   "type": "handshake_response",
    //   "device_id": "...",
    //   "status": "SUCCESS",
    //   "session_token": "...",
    //   "expires_at": 1700000000
    // }

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

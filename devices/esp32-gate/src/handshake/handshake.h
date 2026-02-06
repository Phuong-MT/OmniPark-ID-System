#pragma once
#include <string>
#include <cstdint>

#define HANDSHAKE_TOPIC        "omnipark-id-system/handshake"
#define HANDSHAKE_REQUEST      "handshake_request"
#define HANDSHAKE_RESPONSE     "handshake_response"

enum class HandshakeStatus {
    SUCCESS,
    FAILED,
    INVALID_DEVICE
};

struct HandshakeRequest {
    std::string device_id;
    uint64_t timestamp;          // epoch seconds
};

struct HandshakeResponse {
    std::string device_id;
    HandshakeStatus status;
    std::string session_token;
    uint64_t expires_at;         // epoch seconds
};

class HandshakeManager {
public:
    explicit HandshakeManager(const std::string& deviceId);

    // device → server
    std::string buildRequestPayload() const;

    // server → device
    bool handleResponsePayload(const std::string& payload);

    // session state
    bool hasValidSession(uint64_t now) const;
    const std::string& getSessionToken() const;

private:
    std::string device_id;
    std::string session_token;
    uint64_t expires_at = 0;
};

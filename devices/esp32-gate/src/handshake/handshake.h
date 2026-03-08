#pragma once
#include <string>
#include <cstdint>

#define HANDSHAKE_TOPIC_REQUEST        "omnipark-id-system/device/handshake/req"
inline std::string HANDSHAKE_TOPIC_RESPONSE(const std::string& id) {
    return "omnipark-id-system/device/handshake/" + id + "/ack";
}  

enum class HandshakeStatus {
    SUCCESS,
    FAILED,
    INVALID_DEVICE
};

struct HandshakeRequest {
    std::string device_name;
    uint64_t timestamp;          // epoch seconds
    std::string mac_id;
};

struct HandshakeResponse {
    std::string device_name;
    HandshakeStatus status;
    std::string session_token;
    uint64_t expires_at;         // epoch seconds
};

class HandshakeManager {
public:
    explicit HandshakeManager(const std::string& deviceName, const std::string&macId);

    // device → server
    std::string buildRequestPayload(const std::string& hostname, const std::string& subnetMask, const std::string& localIp) const;

    // server → device
    bool handleResponsePayload(const std::string& payload);

    // session state
    bool hasValidSession(uint64_t now) const;
    const std::string& getSessionToken() const;

private:
    std::string device_name;
    std::string mac_id;
    std::string session_token;
    uint64_t expires_at = 0;
};

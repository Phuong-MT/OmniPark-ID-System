#include <ArduinoJson.h>
#include "handshake.h"
#include "_core/device_info.h"
#include <ctime>

HandshakeManager::HandshakeManager(const std::string& deviceName, const std::string&macId)
    : device_name(deviceName), mac_id(macId) {}

std::string HandshakeManager::buildRequestPayload(const std::string& hostname, const std::string& subnetMask, const std::string& localIp ) const {

    StaticJsonDocument<512> doc;
    doc["type"] = "GATE";
    doc["device_name"] = device_name.c_str();
    doc["timestamp"] = (uint64_t)time(nullptr);
    doc["mac_id"] = mac_id.c_str();
    
    doc["hostname"] = hostname.c_str();
    doc["subnetMask"] = subnetMask.c_str();
    doc["localIp"] = localIp.c_str();

    std::string out;
    serializeJson(doc, out);
    return out;
}

bool HandshakeManager::handleResponsePayload(const std::string& payload) {
    StaticJsonDocument<1024> doc;
    DeviceInfo& deviceInfo = DeviceInfo::getInstance();
    DeserializationError err = deserializeJson(doc, payload);

    if (err) {
        session_token.clear();
        expires_at = 0;

        deviceInfo.setSessionToken("");
        deviceInfo.setSessionTokenExpiresAt(0);
        deviceInfo.setStatus(DeviceStatus::INACTIVE);
        return false;
    }

    if (!doc["deviceId"] ||
        !doc["tenantCode"] ||
        !doc["status"]) {

        deviceInfo.setStatus(DeviceStatus::INACTIVE);
        return false;
    }

    // const char* status = doc["status"];
    // if (!status || strcmp(status, "SUCCESS") != 0) {
    //     session_token.clear();
    //     expires_at = 0;

    //     deviceInfo.setSessionToken("");
    //     deviceInfo.setSessionTokenExpiresAt(0);
    //     deviceInfo.setStatus(DeviceStatus::INACTIVE);
    //     return false;
    // }

    

    session_token = doc["session_token"].as<const char*>();
    expires_at = doc["expires_at"].as<uint64_t>();

    // ===== Basic device info =====
    deviceInfo.setDeviceId(doc["deviceId"].as<const char*>());
    deviceInfo.setTenantCode(doc["tenantCode"].as<const char*>());

    if (doc["deviceName"])
        deviceInfo.setDeviceName(doc["deviceName"].as<const char*>());

    if (doc["deviceType"])
        deviceInfo.setDeviceType(doc["deviceType"].as<const char*>());

    if (doc["macAddress"])
        deviceInfo.setMacAddress(doc["macAddress"].as<const char*>());

     // ===== Status mapping =====
    std::string statusStr = doc["status"].as<const char*>();

    if (statusStr == "ACTIVE") {
        deviceInfo.setStatus(DeviceStatus::ACTIVE);
    }
    else if (statusStr == "BLOCKED") {
        deviceInfo.setStatus(DeviceStatus::BLOCKED);
    }
    else {
        deviceInfo.setStatus(DeviceStatus::INACTIVE);
    }


    // ===== Session =====
    if (doc["sessionToken"])
        deviceInfo.setSessionToken(doc["sessionToken"].as<const char*>());

    if (doc["sessionTokenExpiresAt"])
        deviceInfo.setSessionTokenExpiresAt(doc["sessionTokenExpiresAt"].as<uint64_t>());


    // ===== Pairing (optional) =====
    // if (doc["pairToken"])
    //     deviceInfo.pairToken = doc["pairToken"].as<String>();

    // if (doc["pairTokenExpiresAt"])
    //     deviceInfo.pairTokenExpiresAt =
    //         doc["pairTokenExpiresAt"].as<uint16_t>();

    if(doc["pairState"]){
        std::string pairState = doc["pairState"].as<const char*>();
        if(pairState == "UNPAIRED") deviceInfo.setPairing(DevicePairState::UNPAIRED);
        else if(pairState == "PAIRING") deviceInfo.setPairing(DevicePairState::PAIRING);
        else if(pairState == "PAIRED") deviceInfo.setPairing(DevicePairState::PAIRED);
    }
    // ===== Network info (optional) =====
    if (doc["hostname"] && doc["localIp"] && doc["subnetMask"])
        deviceInfo.setNetworkInfo(doc["hostname"].as<const char*>(),
                                  doc["localIp"].as<const char*>(),
                                  doc["subnetMask"].as<const char*>());


    // ===== Heartbeat =====
    deviceInfo.updateLastSeen();

    return true;
}

bool HandshakeManager::hasValidSession(uint64_t now) const {
    return !session_token.empty() && now < expires_at;
}

const std::string& HandshakeManager::getSessionToken() const {
    return session_token;
}

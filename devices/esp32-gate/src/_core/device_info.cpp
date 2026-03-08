#include "device_info.h"

// ===== Singleton =====
DeviceInfo& DeviceInfo::getInstance() {
    static DeviceInfo instance;
    return instance;
}

// ===== Device identity =====
void DeviceInfo::setDeviceId(const String& id) {
    deviceId = id;
}

void DeviceInfo::setDeviceName(const String& name) {
    deviceName = name;
}

void DeviceInfo::setMacAddress(const String& mac) {
    macAddress = mac;
}

void DeviceInfo::setDeviceType(const String& type) {
    deviceType = type;
}

String DeviceInfo::getDeviceId() const {
    return deviceId;
}

String DeviceInfo::getDeviceName() const {
    return deviceName;
}

String DeviceInfo::getMacAddress() const {
    return macAddress;
}

String DeviceInfo::getDeviceType() const {
    return deviceType;
}

// ===== Tenant =====
void DeviceInfo::setTenantCode(const String& code) {
    tenantCode = code;
}

String DeviceInfo::getTenantCode() const {
    return tenantCode;
}

// ===== Status =====
void DeviceInfo::setStatus(DeviceStatus s) {
    status = s;
}

DeviceStatus DeviceInfo::getStatus() const {
    return status;
}

bool DeviceInfo::isActive() const {
    return status == DeviceStatus::ACTIVE;
}

// ===== Heartbeat =====
void DeviceInfo::updateLastSeen() {
    lastSeenAt = millis();
}

uint64_t DeviceInfo::getLastSeenAt() const {
    return lastSeenAt;
}

// ===== Session =====
void DeviceInfo::setSessionToken(const String& token) {
    sessionToken = token;
}

void DeviceInfo::setSessionTokenExpiresAt(const uint64_t expiresAt) {
    sessionTokenExpiresAt = expiresAt;
}

String DeviceInfo::getSessionToken() const {
    return sessionToken;
}

uint64_t DeviceInfo::getSessionTokenExpiresAt() const {
    return sessionTokenExpiresAt;
}

// ===== Pairing =====
void DeviceInfo::setPairing(DevicePairState value) {
    pairState = value;
}

DevicePairState DeviceInfo::getPairing() const {
    return pairState;
}

void DeviceInfo::setPairToken(const String& token) {
    pairToken = token;
}

void DeviceInfo::setPairTokenExpiresAt(uint64_t expires) {
    pairTokenExpiresAt = expires;
}

String DeviceInfo::getPairToken() const {
    return pairToken;
}

uint64_t DeviceInfo::getPairTokenExpiresAt() const {
    return pairTokenExpiresAt;
}

void DeviceInfo::setNetworkInfo(const String& host,
                                const String& ip,
                                const String& subnet) {
    hostname = host;
    localIp = ip;
    subnetMask = subnet;
}

String DeviceInfo::getHostname() const {
    return hostname;
}

String DeviceInfo::getLocalIp() const {
    return localIp;
}

String DeviceInfo::getSubnetMask() const {
    return subnetMask;
}
#pragma once
#include <Arduino.h>

enum class DeviceStatus {
    ACTIVE,
    INACTIVE,
    BLOCKED
};

enum class DevicePairState{
  UNPAIRED,
  PAIRING,
  PAIRED,
};

class DeviceInfo {
public:
    static DeviceInfo& getInstance();

    // ===== Device identity =====
    void setDeviceId(const String& id);
    void setDeviceName(const String& name);
    void setMacAddress(const String& mac);
    void setDeviceType(const String& type);

    String getDeviceId() const;
    String getDeviceName() const;
    String getMacAddress() const;
    String getDeviceType() const;

    // ===== Tenant =====
    void setTenantCode(const String& code);
    String getTenantCode() const;

    // ===== Status =====
    void setStatus(DeviceStatus status);
    DeviceStatus getStatus() const;
    bool isActive() const;

    // ===== Heartbeat =====
    void updateLastSeen();
    uint64_t getLastSeenAt() const;

    // ===== Session =====
    void setSessionToken(const String& token);
    void setSessionTokenExpiresAt(const uint64_t expiresAt);
    String getSessionToken() const;
    uint64_t getSessionTokenExpiresAt() const;

    // ===== Pairing =====
    void setPairing(DevicePairState value);
    DevicePairState getPairing() const;

    void setPairToken(const String& token);
    void setPairTokenExpiresAt(uint64_t expires);
    String getPairToken() const;
    uint64_t getPairTokenExpiresAt() const;

    void setNetworkInfo(const String& host,
                        const String& ip,
                        const String& subnet);

    String getHostname() const;
    String getLocalIp() const;
    String getSubnetMask() const;

private:
    DeviceInfo() = default;

    // Device info
    String deviceId;
    String deviceName;
    String macAddress;
    String deviceType;

    // Tenant
    String tenantCode;

    // Heartbeat
    uint64_t lastSeenAt = 0;

    // Session
    String sessionToken;
    uint64_t sessionTokenExpiresAt;

    // Pairing
    DevicePairState  pairState = DevicePairState::UNPAIRED;
    String pairToken;
    uint64_t pairTokenExpiresAt = 0;
    
    String hostname;
    String localIp;
    String subnetMask;
    
    // Status
    DeviceStatus status = DeviceStatus::INACTIVE;
    // friend class DeviceManager;
};
export interface HandshakeRequest {
    type: string;
    device_name: string;
    timestamp: number;
    mac_id: string;

    hostname: string;
    localIp: string;
    subnetMask: string;
}

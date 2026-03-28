export const MQTT_TOPICS = {
  HANDSHAKE_INIT: 'omnipark-id-system/device/handshake/req',
  HANDSHAKE_ACK: (id: string) => `omnipark-id-system/device/handshake/ack/${id}`,
};

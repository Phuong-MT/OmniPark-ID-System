export const MQTT_TOPICS = {
  HANDSHAKE_INIT: 'device/handshake/init',
  HANDSHAKE_ACK: (id: string) => `device/${id}/handshake/ack`,
};

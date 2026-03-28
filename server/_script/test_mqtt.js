const mqtt = require('mqtt');

// 🔥 sửa đúng host của bạn
const client = mqtt.connect('mqtt://localhost:1883'); 
// nếu chạy trong docker: mqtt://hivemq:1883

const MAC = '6ff4e9d4';

const REQ_TOPIC = 'omnipark-id-system/device/handshake/req';
const ACK_TOPIC = `omnipark-id-system/device/handshake/ack/${MAC}`;

client.on('connect', () => {
  console.log('✅ Connected to MQTT');

  // 🔥 subscribe ACK trước
  client.subscribe(ACK_TOPIC, (err) => {
    if (err) {
      console.error('❌ Subscribe failed:', err);
      return;
    }

    console.log('📡 Subscribed:', ACK_TOPIC);

    // 🔥 gửi request giống ESP
    const payload = {
      type: 'GATE',
      device_name: `ESP32_GATE_${MAC}`,
      timestamp: Date.now(),
      mac_id: MAC,
      hostname: 'TEST_GATE',
      subnetMask: '255.255.255.0',
      localIp: '192.168.1.100'
    };

    console.log('📤 Sending handshake...');
    client.publish(REQ_TOPIC, JSON.stringify(payload));
  });
});

client.on('message', (topic, message) => {
  console.log('📥 RECEIVED');
  console.log('Topic:', topic);
  console.log('Payload:', message.toString());
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err);
});
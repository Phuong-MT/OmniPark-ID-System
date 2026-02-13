import { Controller, Logger } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { MqttSubscribe } from '../mqtt/ mqtt.decorator';
import { MqttService } from 'src/mqtt/mqtt.service';
import { MQTT_TOPICS } from 'src/mqtt/topics';
import type { HandshakeRequest } from './schema/devices.dto';

@Controller('devices')
export class DevicesController {
  private readonly logger = new Logger('Controller Devices');

  constructor(
    private readonly devicesService: DevicesService,
    private readonly mqttService: MqttService,
  ) {}
  @MqttSubscribe(MQTT_TOPICS.HANDSHAKE_INIT)
  async handleHandshakeInit(message: HandshakeRequest) {
    const { type, device_name, timestamp, mac_id } = message;

    // add device or update last handshake
    const device = await this.devicesService.findOrCreate({
      macAddress: mac_id,
      type,
      deviceName: device_name,
    });
    //set token
    //test token
    const accessToken = 'token';
    //send ack
    this.mqttService.publish(MQTT_TOPICS.HANDSHAKE_ACK(mac_id), {
      type: 'handshake_response',
      device_id: mac_id,
      status: 'SUCCESS',
      session_token: accessToken,
      expires_at: 1700000000,
    });
  }
}

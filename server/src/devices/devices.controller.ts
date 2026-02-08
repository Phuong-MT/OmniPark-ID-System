import { Controller, Logger } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { MqttSubscribe } from '../mqtt/ mqtt.decorator';
import { MqttService } from 'src/mqtt/mqtt.service';

@Controller('devices')
export class DevicesController {
  private readonly logger = new Logger('Controller Devices');

  constructor(
    private readonly devicesService: DevicesService,
    private readonly mqttService: MqttService,
  ) {}
  @MqttSubscribe('device/handshake/req')
  async handleHandshakeInit(message: any) {
    this.logger.log('Received handshake init:', message);

    //send ack
    this.mqttService.publish('device/handshake/ack', {
      type: 'handshake_response',
      device_id: '...',
      status: 'SUCCESS',
      session_token: '...',
      expires_at: 1700000000,
    });
  }
}

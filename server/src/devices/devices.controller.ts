import { Controller } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { MqttSubscribe } from '../mqtt/ mqtt.decorator';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}
  @MqttSubscribe('omnipark-id-system/handshake')
  async handleHandshakeInit(message: any) {
    console.log('Received handshake init:', message);
  }
}

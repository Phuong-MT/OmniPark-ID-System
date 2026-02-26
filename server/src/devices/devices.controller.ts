import { Controller, Logger } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { MqttSubscribe } from '../mqtt/ mqtt.decorator';
import { MqttService } from 'src/mqtt/mqtt.service';
import { MQTT_TOPICS } from 'src/mqtt/topics';
import type { HandshakeRequest } from './schema/devices.dto';

@Controller('devices')
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);

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

  /**
   * Topic: iot/:tenantCode/:gwType/:gwId/pair-forward
   * Payload: { macAddress: string, type: string }
   */
  @MqttSubscribe('iot/:tenantCode/:gwType/:gwId/pair-forward')
  async handlePairForward(
    data: { macAddress: string; type: string },
    context: { params: Record<string, string> },
  ) {
    const { tenantCode } = context.params;
    this.logger.log(
      `Pair forward received for ${data.macAddress} from tenant ${tenantCode}`,
    );

    try {
      const device = await this.devicesService.handlePairRequest({
        tenantCode,
        macAddress: data.macAddress,
        type: data.type,
      });

      // Publish response to the new device topic
      // Topic pattern: iot/{tenantCode}/{deviceType}/{macAddress}/pair-token
      const responseTopic = `iot/${tenantCode}/${data.type}/${device.macAddress}/pair-token`;
      this.mqttService.publish(responseTopic, {
        pairToken: device.pairToken,
        expiresAt: device.pairTokenExpiresAt,
      });

      this.logger.log(`Sent pair token to ${responseTopic}`);
    } catch (error) {
      this.logger.error(`Failed to handle pair forward: ${error.message}`);
    }
  }

  /**
   * Topic: iot/:tenantCode/:type/:mac/pair-activate
   * Payload: { token: string }
   */
  @MqttSubscribe('iot/:tenantCode/:type/:mac/pair-activate')
  async handlePairActivate(
    data: { token: string },
    context: { params: Record<string, string> },
  ) {
    const { mac } = context.params;
    this.logger.log(`Activation request for ${mac} with token ${data.token}`);

    try {
      await this.devicesService.activateDevice(mac, data.token);
      this.logger.log(`Device ${mac} activated successfully`);

      // Notify device it's active
      const responseTopic = `iot/${context.params.tenantCode}/${context.params.type}/${mac}/pair-status`;
      this.mqttService.publish(responseTopic, { status: 'ACTIVE' });
    } catch (error) {
      this.logger.error(`Activation failed for ${mac}: ${error.message}`);
    }
  }
}

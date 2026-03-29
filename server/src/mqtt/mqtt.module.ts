import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { DiscoveryModule } from '@nestjs/core';
@Module({
    imports: [DiscoveryModule],
    providers: [MqttService],
    exports: [MqttService],
})
export class MqttModule {}

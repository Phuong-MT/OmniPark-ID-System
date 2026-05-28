import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { EdgeController } from './edge.controller';

@Module({
    imports: [DevicesModule],
    controllers: [EdgeController],
})
export class EdgeModule {}

import { MongooseModule } from '@nestjs/mongoose';
import { DBName } from 'src/utils/connectDB';
import { Device, DeviceSchema } from './schema/devices.schema';
import { forwardRef, Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { DevicesGateway } from './devices.gateway';
import { Park, ParkSchema } from 'src/parks/schema/park.schema';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: Device.name, schema: DeviceSchema },
                { name: Park.name, schema: ParkSchema },
            ],
            DBName.omniparkIDSystem,
        ),
        forwardRef(() => MqttModule),
    ],
    controllers: [DevicesController],
    providers: [DevicesService, DevicesGateway],
    exports: [DevicesService, DevicesGateway],
})
export class DevicesModule {}

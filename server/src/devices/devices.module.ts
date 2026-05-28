import { MongooseModule } from '@nestjs/mongoose';
import { DBName } from 'src/utils/connectDB';
import { Device, DeviceSchema } from './schema/devices.schema';
import { forwardRef, Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
    imports: [
        MongooseModule.forFeature(
            [{ name: Device.name, schema: DeviceSchema }],
            DBName.omniparkIDSystem,
        ),
        forwardRef(() => MqttModule),
        AssignmentsModule,
    ],
    controllers: [DevicesController],
    providers: [DevicesService],
    exports: [DevicesService],
})
export class DevicesModule {}

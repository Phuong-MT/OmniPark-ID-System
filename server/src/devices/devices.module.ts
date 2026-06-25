import { MongooseModule } from '@nestjs/mongoose';
import { DBName } from 'src/utils/connectDB';
import { Device, DeviceSchema } from './schema/devices.schema';
import { CheckInOut, CheckInOutSchema } from './schema/check-in-out.schema';
import { forwardRef, Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { SocketModule } from '../socket/socket.module';
import { Park, ParkSchema } from 'src/parks/schema/park.schema';
import { AssignmentsModule } from '@/assignments/assignments.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: Device.name, schema: DeviceSchema },
                { name: Park.name, schema: ParkSchema },
                { name: CheckInOut.name, schema: CheckInOutSchema },
            ],
            DBName.omniparkIDSystem,
        ),
        forwardRef(() => MqttModule),
        forwardRef(() => SocketModule),
        forwardRef(() => AssignmentsModule),
        CloudinaryModule,
    ],
    controllers: [DevicesController],
    providers: [DevicesService],
    exports: [DevicesService],
})
export class DevicesModule {}

import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { DevicesModule } from '../devices/devices.module';

@Module({
    imports: [forwardRef(() => DevicesModule)],
    providers: [SocketGateway],
    exports: [SocketGateway],
})
export class SocketModule {}

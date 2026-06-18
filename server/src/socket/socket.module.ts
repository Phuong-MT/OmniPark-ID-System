import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { DevicesModule } from '../devices/devices.module';
import { SocketEdge } from './socket.edge';

@Module({
    imports: [forwardRef(() => DevicesModule)],
    providers: [SocketGateway, SocketEdge],
    exports: [SocketGateway],
})
export class SocketModule {}

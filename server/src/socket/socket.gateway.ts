import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DevicesService } from '../devices/devices.service';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';

@WebSocketGateway({
    path: '/socket',
    cors: {
        origin: '*',
    },
})
@Injectable()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(SocketGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(
        @Inject(forwardRef(() => DevicesService))
        private readonly devicesService: DevicesService,
    ) {}
    afterInit() {
        this.devicesService.registerGateway(this);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('request_pairing_list')
    async handleRequestPairingList(@ConnectedSocket() client: Socket) {
        this.logger.log(`Client ${client.id} requested pairing list`);
        try {
            const devices = await this.devicesService.getPairingDevices();
            client.emit('pairing_devices_list', devices);
        } catch (error: any) {
            client.emit('error', { message: error?.message });
        }
    }

    @SubscribeMessage('pair_device')
    async handlePairDevice(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        data: { macAddress: string; objectId: string; sectionId: string },
    ) {
        this.logger.log(`Pairing request received: ${JSON.stringify(data)}`);
        try {
            await this.devicesService.initiatePairConfirm(
                data.macAddress,
                data.objectId,
                data.sectionId,
            );
            client.emit('pair_initiated', {
                macAddress: data.macAddress,
                status: 'INITIATED',
            });
        } catch (error: any) {
            client.emit('error', { message: error?.message });
        }
    }

    notifyPairSuccess(macAddress: string, device: any) {
        console.log('Emitting pair_success event for', macAddress);
        this.server.emit('pair_success', { macAddress, device });
    }
}

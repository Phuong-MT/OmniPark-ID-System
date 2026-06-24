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
import { SocketEdge } from './socket.edge';

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
        @Inject(forwardRef(()=>SocketEdge))
        private readonly socketEdge: SocketEdge
    ) {}
    afterInit() {
        this.devicesService.registerGateway(this);
        this.socketEdge.registerGateway(this);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.socketEdge.handleDisconnect(client);
    }

    @SubscribeMessage('edge_identify')
    handleEdgeIdentify(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { tenantCode: string },
    ) {
        return this.socketEdge.handleEdgeIdentify(client, data);
    }

    @SubscribeMessage('request_camera_stream')
    handleRequestCameraStream(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { tenantCode: string; cameraId: string },
    ) {
        return this.socketEdge.handleRequestCameraStream(client, data);
    }

    @SubscribeMessage('response_camera_webrtc_url')
    handleResponseCameraWebRTCUrl(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { cameraId: string; streamUrl: string; requesterSocketId: string },
    ) {
        return this.socketEdge.handleResponseCameraWebRTCUrl(client, data);
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

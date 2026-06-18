import { Injectable, Logger } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";
import { ConnectedSocket, MessageBody, SubscribeMessage } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';

@Injectable()
export class SocketEdge {
    private readonly logger = new Logger(SocketEdge.name);
    constructor(
    ) {}
    private gateway: SocketGateway;
    registerGateway(gateway: SocketGateway) {
        this.gateway = gateway;
    }

    async handleEdgeIdentify(
        @ConnectedSocket() client: Socket,
        @MessageBody() data:{ tenantCode: string}
    ){
        const {tenantCode} = data;
        this.logger.log(`Edge identification request from tenant ${tenantCode} with client id ${client.id}`);
    }
}
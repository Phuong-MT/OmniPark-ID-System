import { Injectable, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
export class SocketEdge {
    private readonly logger = new Logger(SocketEdge.name);

    // Map tenantCode -> Socket ID
    private activeEdges = new Map<string, string>();
    // Map Socket ID -> tenantCode
    private socketToTenant = new Map<string, string>();

    constructor() {}

    private gateway: SocketGateway;
    registerGateway(gateway: SocketGateway) {
        this.gateway = gateway;
    }

    async handleEdgeIdentify(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { tenantCode: string },
    ) {
        const { tenantCode } = data;
        this.logger.log(
            `Edge identification request from tenant ${tenantCode} with client id ${client.id}`,
        );

        this.activeEdges.set(tenantCode, client.id);
        this.socketToTenant.set(client.id, tenantCode);
    }

    handleDisconnect(client: Socket) {
        const tenantCode = this.socketToTenant.get(client.id);
        if (tenantCode) {
            this.activeEdges.delete(tenantCode);
            this.socketToTenant.delete(client.id);
            this.logger.log(`Edge for tenant ${tenantCode} disconnected.`);
        }
    }

    async handleRequestCameraStream(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { tenantCode: string; cameraId: string },
    ) {
        const { tenantCode, cameraId } = data;
        this.logger.log(
            `Browser client ${client.id} requested stream for tenant ${tenantCode}, camera ${cameraId}`,
        );

        const edgeSocketId = this.activeEdges.get(tenantCode);
        if (!edgeSocketId) {
            this.logger.warn(`No active Edge found for tenant ${tenantCode}`);
            client.emit('camera_stream_error', {
                message: 'Edge node not online',
            });
            return;
        }

        // Do MediaMTX đứng sau NAT, chúng ta cần gửi yêu cầu cho Edge báo thông tin URL WebRTC của nó,
        // hoặc Edge cung cấp địa chỉ IP public/NAT mapping của nó.
        // Để linh hoạt, ta gửi event "get_camera_webrtc_url" xuống Edge.
        this.gateway.server
            .to(edgeSocketId)
            .emit('get_camera_webrtc_url', {
                cameraId,
                requesterSocketId: client.id,
            });
    }

    async handleResponseCameraWebRTCUrl(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        data: {
            cameraId: string;
            streamUrl: string;
            requesterSocketId: string;
        },
    ) {
        const { cameraId, streamUrl, requesterSocketId } = data;
        this.logger.log(
            `Forwarding WebRTC stream URL to browser ${requesterSocketId}: ${streamUrl}`,
        );

        this.gateway.server.to(requesterSocketId).emit('camera_stream_url', {
            cameraId,
            streamUrl, // Ví dụ: http://<ip-edge>:8889/<tenantCode>_<cameraId>
        });
    }

    // -------------------------------------------------------
    // Request snapshot from Edge via Socket.IO (callback-based)
    // -------------------------------------------------------
    async requestSnapshot(
        tenantCode: string,
        cameraId: string,
    ): Promise<{
        plate_number: string;
        confidence: number;
        image_base64: string;
    } | null> {
        const edgeSocketId = this.activeEdges.get(tenantCode);
        if (!edgeSocketId) {
            this.logger.warn(
                `requestSnapshot: No active Edge for tenant ${tenantCode}`,
            );
            return null;
        }

        const server = this.gateway?.server;
        if (!server) {
            this.logger.warn(`requestSnapshot: SocketGateway server not ready`);
            return null;
        }

        const edgeSocket = server.sockets.sockets.get(edgeSocketId);
        if (!edgeSocket) {
            this.logger.warn(
                `requestSnapshot: Edge socket ${edgeSocketId} not found`,
            );
            return null;
        }

        return new Promise((resolve) => {
            const TIMEOUT_MS = 5000;
            const timer = setTimeout(() => {
                this.logger.warn(
                    `requestSnapshot: timeout waiting for snapshot from tenant ${tenantCode}`,
                );
                resolve(null);
            }, TIMEOUT_MS);

            // Emit with callback — Edge will call the ack function with snapshot data
            edgeSocket.emit(
                'get_camera_snapshot',
                { cameraId },
                (response: any) => {
                    clearTimeout(timer);
                    if (response && response.plate_number !== undefined) {
                        this.logger.log(
                            `requestSnapshot: received snapshot for camera ${cameraId}`,
                        );
                        resolve(response);
                    } else {
                        this.logger.warn(
                            `requestSnapshot: empty or invalid response from edge`,
                        );
                        resolve(null);
                    }
                },
            );
        });
    }
}

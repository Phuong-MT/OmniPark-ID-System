import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { EdgeEventDto } from './dto/edge-event.dto';

@Controller('edge')
export class EdgeController {
    constructor(private readonly devicesService: DevicesService) {}

    @Get('config/cameras')
    async getCameraConfig(
        @Query('edgeNodeId') edgeNodeId?: string,
        @Query('parkId') parkId?: string,
    ) {
        return this.devicesService.getEdgeCameraConfig({ edgeNodeId, parkId });
    }

    @Post('events')
    async receiveEvent(@Body() event: EdgeEventDto) {
        const camera = await this.devicesService.validateEdgeCameraEvent(
            event.camera_id,
        );

        return {
            status: 'accepted',
            eventId: event.event_id,
            cameraId: camera._id,
        };
    }
}

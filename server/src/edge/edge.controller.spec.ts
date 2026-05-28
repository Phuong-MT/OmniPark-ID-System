import { Test, TestingModule } from '@nestjs/testing';
import { EdgeController } from './edge.controller';
import { DevicesService } from '../devices/devices.service';

describe('EdgeController', () => {
    let controller: EdgeController;
    let devicesService: Record<string, jest.Mock>;

    beforeEach(async () => {
        devicesService = {
            getEdgeCameraConfig: jest.fn(),
            validateEdgeCameraEvent: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [EdgeController],
            providers: [
                {
                    provide: DevicesService,
                    useValue: devicesService,
                },
            ],
        }).compile();

        controller = module.get<EdgeController>(EdgeController);
    });

    it('should return edge camera config', async () => {
        const config = [{ id: 'camera-1', url: 'rtsp://10.0.0.10/stream' }];
        devicesService.getEdgeCameraConfig.mockResolvedValue(config);

        const result = await controller.getCameraConfig('edge-default', 'park-1');

        expect(devicesService.getEdgeCameraConfig).toHaveBeenCalledWith({
            edgeNodeId: 'edge-default',
            parkId: 'park-1',
        });
        expect(result).toEqual(config);
    });

    it('should validate camera before accepting edge events', async () => {
        devicesService.validateEdgeCameraEvent.mockResolvedValue({
            _id: 'camera-1',
        });

        const result = await controller.receiveEvent({
            event_id: 'event-1',
            timestamp: new Date().toISOString(),
            type: 'PLATE_DETECTED' as any,
            camera_id: 'camera-1',
            payload: { plate_number: '51A12345' },
        });

        expect(devicesService.validateEdgeCameraEvent).toHaveBeenCalledWith(
            'camera-1',
        );
        expect(result).toEqual({
            status: 'accepted',
            eventId: 'event-1',
            cameraId: 'camera-1',
        });
    });
});

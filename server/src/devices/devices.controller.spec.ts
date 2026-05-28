import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { MqttService } from '../mqtt/mqtt.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { UserRole } from '../user/schema/user.schema';
import { ConfigService } from '@nestjs/config';

describe('DevicesController', () => {
    let controller: DevicesController;
    let devicesService: Record<string, jest.Mock>;
    let assignmentsService: Record<string, jest.Mock>;

    beforeEach(async () => {
        devicesService = {
            createDevice: jest.fn(),
            findDevices: jest.fn(),
            findByDeviceId: jest.fn(),
            findCameras: jest.fn(),
            createCamera: jest.fn(),
            updateCamera: jest.fn(),
            handlePairRequest: jest.fn(),
            activateDevice: jest.fn(),
            updateHeartbeat: jest.fn(),
        };
        assignmentsService = {
            getPocAssignments: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [DevicesController],
            providers: [
                {
                    provide: DevicesService,
                    useValue: devicesService,
                },
                {
                    provide: AssignmentsService,
                    useValue: assignmentsService,
                },
                {
                    provide: MqttService,
                    useValue: {
                        publish: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(undefined),
                    },
                },
            ],
        }).compile();

        controller = module.get<DevicesController>(DevicesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should restrict POC camera queries to assigned parks', async () => {
        devicesService.findCameras.mockResolvedValue({ data: [], total: 0 });
        assignmentsService.getPocAssignments.mockResolvedValue([
            { parkId: { toString: () => 'park-a' } },
        ]);

        await controller.findCameras(
            {
                user: {
                    userId: 'poc-1',
                    role: UserRole.POC,
                    tenantCode: 'tenant-1',
                },
            },
            '1',
            '10',
            undefined,
            'park-a',
        );

        expect(assignmentsService.getPocAssignments).toHaveBeenCalledWith(
            'poc-1',
        );
        expect(devicesService.findCameras).toHaveBeenCalledWith(
            {
                tenantCode: 'tenant-1',
                parkId: 'park-a',
                edgeNodeId: undefined,
                search: undefined,
                parkIds: ['park-a'],
            },
            1,
            10,
        );
    });

    it('should create camera with tenant from selected park payload for super admin', async () => {
        const payload: any = {
            tenantCode: 'tenant-from-park',
            parkId: 'park-1',
            deviceName: 'Camera 1',
        };

        await controller.createCamera(
            { user: { role: UserRole.SUPER_ADMIN } },
            payload,
        );

        expect(devicesService.createCamera).toHaveBeenCalledWith({
            ...payload,
            tenantCode: 'tenant-from-park',
        });
    });
});

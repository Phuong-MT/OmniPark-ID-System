import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { getModelToken } from '@nestjs/mongoose';
import {
    CameraDirection,
    Device,
    DeviceStatus,
    DeviceType,
} from './schema/devices.schema';
import { DBName } from 'src/utils/connectDB';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('DevicesService', () => {
    let service: DevicesService;
    let deviceModel: any;

    beforeEach(async () => {
        deviceModel = {
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn(),
            findOne: jest.fn().mockReturnThis(),
            create: jest.fn(),
            save: jest.fn(),
            exists: jest.fn(),
            findOneAndUpdate: jest.fn(),
            countDocuments: jest.fn(),
            updateOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DevicesService,
                {
                    provide: getModelToken(
                        Device.name,
                        DBName.omniparkIDSystem,
                    ),
                    useValue: deviceModel,
                },
            ],
        }).compile();

        service = module.get<DevicesService>(DevicesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createDevice', () => {
        it('should create a new device', async () => {
            deviceModel.exists.mockResolvedValue(false);
            const mockDevice = {
                macAddress: 'AA:BB:CC',
                status: DeviceStatus.ACTIVE,
            };
            deviceModel.create.mockResolvedValue(mockDevice);

            const result = await service.createDevice({
                deviceId: 'dev1',
                macAddress: 'AA:BB:CC',
                type: 'GATE',
                tenantCode: 'tenant1',
                rootKeyHash: 'hash',
            });

            expect(deviceModel.exists).toHaveBeenCalled();
            expect(deviceModel.create).toHaveBeenCalled();
            expect(result).toEqual(mockDevice);
        });

        it('should throw ConflictException if device exists', async () => {
            deviceModel.exists.mockResolvedValue(true);

            await expect(
                service.createDevice({
                    deviceId: 'dev1',
                    macAddress: 'AA:BB:CC',
                    type: 'GATE',
                    tenantCode: 'tenant1',
                    rootKeyHash: 'hash',
                }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('findDevices', () => {
        it('should return devices list', async () => {
            const tenantCode = new Types.ObjectId().toString();
            const mockResult = [{ deviceId: 'dev1' }];
            deviceModel.lean.mockResolvedValue(mockResult);
            deviceModel.countDocuments.mockResolvedValue(1);

            const result = await service.findDevices({
                tenantCode,
                status: DeviceStatus.ACTIVE,
            });

            expect(deviceModel.find).toHaveBeenCalledWith({
                tenantCode: new Types.ObjectId(tenantCode),
                status: DeviceStatus.ACTIVE,
            });
            expect(result).toEqual({
                data: mockResult,
                total: 1,
                page: 1,
                limit: 10,
            });
        });
    });

    describe('camera management', () => {
        it('should create an RTSP camera as a device', async () => {
            const tenantCode = new Types.ObjectId().toString();
            const parkId = new Types.ObjectId().toString();
            const mockCamera = {
                _id: new Types.ObjectId(),
                type: DeviceType.CAMERA_LRP,
            };
            deviceModel.exists.mockResolvedValue(false);
            deviceModel.create.mockResolvedValue(mockCamera);

            const result = await service.createCamera({
                tenantCode,
                parkId,
                deviceName: 'Gate A LPR',
                macAddress: 'aa:bb:cc:dd:ee:ff',
                type: DeviceType.CAMERA_LRP,
                streamUrl: 'rtsp://user:pass@10.0.0.10:554/stream1',
                direction: CameraDirection.IN,
                edgeNodeId: 'edge-default',
            });

            expect(deviceModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    deviceName: 'Gate A LPR',
                    macAddress: 'AA:BB:CC:DD:EE:FF',
                    type: DeviceType.CAMERA_LRP,
                    tenantCode: new Types.ObjectId(tenantCode),
                    parkId: new Types.ObjectId(parkId),
                    status: DeviceStatus.ACTIVE,
                    cameraConfig: expect.objectContaining({
                        streamUrl: 'rtsp://user:pass@10.0.0.10:554/stream1',
                        direction: CameraDirection.IN,
                        enabled: true,
                        aiEnabled: true,
                        edgeNodeId: 'edge-default',
                    }),
                }),
            );
            expect(result).toEqual(mockCamera);
        });

        it('should reject camera creation without an RTSP URL', async () => {
            await expect(
                service.createCamera({
                    tenantCode: new Types.ObjectId().toString(),
                    parkId: new Types.ObjectId().toString(),
                    deviceName: 'Invalid camera',
                    macAddress: 'AA:BB:CC:DD:EE:FF',
                    type: DeviceType.CAMERA_LRP,
                    streamUrl: 'http://10.0.0.10/stream',
                    direction: CameraDirection.IN,
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should return only edge-ready camera config shape', async () => {
            const cameraId = new Types.ObjectId();
            const parkId = new Types.ObjectId();
            const clusterId = new Types.ObjectId();
            deviceModel.lean.mockResolvedValue([
                {
                    _id: cameraId,
                    type: DeviceType.CAMERA_LRP,
                    parkId,
                    clusterId,
                    cameraConfig: {
                        streamUrl: 'rtsp://10.0.0.10/stream',
                        direction: CameraDirection.OUT,
                    },
                },
            ]);

            const result = await service.getEdgeCameraConfig({
                edgeNodeId: 'edge-default',
            });

            expect(deviceModel.find).toHaveBeenCalledWith({
                type: { $in: [DeviceType.CAMERA_LRP, DeviceType.CAMERA_FACE] },
                status: DeviceStatus.ACTIVE,
                'cameraConfig.enabled': true,
                'cameraConfig.aiEnabled': true,
                'cameraConfig.streamUrl': { $exists: true, $ne: '' },
                'cameraConfig.edgeNodeId': 'edge-default',
            });
            expect(result).toEqual([
                {
                    id: cameraId.toString(),
                    url: 'rtsp://10.0.0.10/stream',
                    direction: CameraDirection.OUT,
                    parkId: parkId.toString(),
                    clusterId: clusterId.toString(),
                    type: DeviceType.CAMERA_LRP,
                },
            ]);
        });

        it('should reject edge events for missing or inactive cameras', async () => {
            deviceModel.lean.mockResolvedValue(null);

            await expect(
                service.validateEdgeCameraEvent(new Types.ObjectId().toString()),
            ).rejects.toThrow(NotFoundException);
        });

        it('should accept edge events for active cameras and update health timestamp', async () => {
            const cameraId = new Types.ObjectId();
            const mockCamera = { _id: cameraId, type: DeviceType.CAMERA_LRP };
            deviceModel.lean.mockResolvedValue(mockCamera);
            deviceModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

            const result = await service.validateEdgeCameraEvent(cameraId.toString());

            expect(deviceModel.findOne).toHaveBeenCalledWith({
                _id: new Types.ObjectId(cameraId.toString()),
                type: { $in: [DeviceType.CAMERA_LRP, DeviceType.CAMERA_FACE] },
                status: DeviceStatus.ACTIVE,
                'cameraConfig.enabled': true,
            });
            expect(deviceModel.updateOne).toHaveBeenCalledWith(
                { _id: cameraId },
                { $set: { 'cameraConfig.lastHealthAt': expect.any(Date) } },
            );
            expect(result).toEqual(mockCamera);
        });
    });

    describe('findByDeviceId', () => {
        it('should find device by deviceId', async () => {
            const mockResult = { deviceId: 'dev1' };
            deviceModel.lean.mockResolvedValue(mockResult);

            const result = await service.findByDeviceId('dev1');

            expect(deviceModel.findOne).toHaveBeenCalledWith({
                deviceId: 'dev1',
            });
            expect(result).toEqual(mockResult);
        });

        it('should throw NotFoundException if not found', async () => {
            deviceModel.lean.mockResolvedValue(null);

            await expect(service.findByDeviceId('dev1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('activateDevice', () => {
        it('should activate a paired device', async () => {
            const mockDevice = {
                status: DeviceStatus.INACTIVE,
                save: jest.fn(),
            };
            deviceModel.findOne.mockResolvedValue(mockDevice);

            await service.activateDevice('AA:BB:CC', 'token123');

            expect(mockDevice.status).toEqual(DeviceStatus.ACTIVE);
            expect(mockDevice.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if invalid token', async () => {
            deviceModel.findOne.mockResolvedValue(null);

            await expect(
                service.activateDevice('AA:BB:CC', 'invalid_token'),
            ).rejects.toThrow(NotFoundException);
        });
    });
});

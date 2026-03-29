import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { getModelToken } from '@nestjs/mongoose';
import { Device, DeviceStatus } from './schema/devices.schema';
import { DBName } from 'src/utils/connectDB';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('DevicesService', () => {
    let service: DevicesService;
    let deviceModel: any;

    beforeEach(async () => {
        deviceModel = {
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn(),
            findOne: jest.fn().mockReturnThis(),
            create: jest.fn(),
            save: jest.fn(),
            exists: jest.fn(),
            findOneAndUpdate: jest.fn(),
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
            const mockResult = [{ deviceId: 'dev1' }];
            deviceModel.lean.mockResolvedValue(mockResult);

            const result = await service.findDevices({
                tenantCode: 'tenant1',
                status: DeviceStatus.ACTIVE,
            });

            expect(deviceModel.find).toHaveBeenCalledWith({
                tenantCode: 'tenant1',
                status: DeviceStatus.ACTIVE,
            });
            expect(result).toEqual(mockResult);
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

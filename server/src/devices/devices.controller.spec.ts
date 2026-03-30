import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { MqttService } from '../mqtt/mqtt.service';

describe('DevicesController', () => {
    let controller: DevicesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DevicesController],
            providers: [
                {
                    provide: DevicesService,
                    useValue: {
                        createDevice: jest.fn(),
                        findDevices: jest.fn(),
                        findByDeviceId: jest.fn(),
                        handlePairRequest: jest.fn(),
                        activateDevice: jest.fn(),
                    },
                },
                {
                    provide: MqttService,
                    useValue: {
                        // Mock methods if needed
                    },
                },
            ],
        }).compile();

        controller = module.get<DevicesController>(DevicesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

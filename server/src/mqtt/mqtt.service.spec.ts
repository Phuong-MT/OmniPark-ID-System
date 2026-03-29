import { Test, TestingModule } from '@nestjs/testing';
import { MqttService } from './mqtt.service';
import { ConfigService } from '@nestjs/config';
import { DiscoveryService, Reflector } from '@nestjs/core';

jest.mock('mqtt', () => ({
    connect: jest.fn().mockReturnValue({
        on: jest.fn(),
        subscribe: jest.fn(),
        publish: jest.fn(),
        end: jest.fn(),
    }),
}));

describe('MqttService', () => {
    let service: MqttService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MqttService,
                {
                    provide: ConfigService,
                    useValue: {},
                },
                {
                    provide: DiscoveryService,
                    useValue: {},
                },
                {
                    provide: Reflector,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<MqttService>(MqttService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

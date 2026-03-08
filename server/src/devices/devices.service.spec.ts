import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { getModelToken } from '@nestjs/mongoose';
import { Device } from './schema/devices.schema';
import { DBName } from 'src/utils/connectDB';

describe('DevicesService', () => {
  let service: DevicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getModelToken(Device.name, DBName.omniparkIDSystem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            exists: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

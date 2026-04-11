import { Test, TestingModule } from '@nestjs/testing';
import { ParksService } from './parks.service';
import { getModelToken } from '@nestjs/mongoose';
import { Park } from './schema/park.schema';
import { DBName } from '../utils/connectDB';

describe('ParksService', () => {
    let service: ParksService;

    const mockParkModel = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: 'park1' }]),
        countDocuments: jest.fn().mockResolvedValue(1),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ParksService,
                {
                    provide: getModelToken(Park.name, DBName.omniparkIDSystem),
                    useValue: mockParkModel,
                },
            ],
        }).compile();

        service = module.get<ParksService>(ParksService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findParks', () => {
        it('should fetch parks standard flow', async () => {
            const result = await service.findParks({ tenantCode: 'tenant1' });
            expect(result.total).toBe(1);
            expect(result.data).toHaveLength(1);
            expect(mockParkModel.find).toHaveBeenCalledWith({
                tenantCode: 'tenant1',
            });
        });

        it('should apply parkIds filter when provided', async () => {
            await service.findParks({ parkIds: ['park1', 'park2'] });
            expect(mockParkModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: { $in: ['park1', 'park2'] },
                }),
            );
        });

        it('should apply empty array filter if parkIds is empty', async () => {
            await service.findParks({ parkIds: [] });
            expect(mockParkModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: { $in: [] },
                }),
            );
        });
    });
});

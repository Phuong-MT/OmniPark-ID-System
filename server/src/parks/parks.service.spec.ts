import { Test, TestingModule } from '@nestjs/testing';
import { ParksService } from './parks.service';
import { getModelToken } from '@nestjs/mongoose';
import { Park } from './schema/park.schema';
import { DBName } from '../utils/connectDB';
import { Types } from 'mongoose';

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
            const tenantCode = new Types.ObjectId().toString();
            const result = await service.findParks({ tenantCode });
            expect(result.total).toBe(1);
            expect(result.data).toHaveLength(1);
            expect(mockParkModel.find).toHaveBeenCalledWith({
                tenantCode: new Types.ObjectId(tenantCode),
            });
        });

        it('should apply parkIds filter when provided', async () => {
            const parkIds = [
                new Types.ObjectId().toString(),
                new Types.ObjectId().toString(),
            ];
            await service.findParks({ parkIds });
            expect(mockParkModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: {
                        $in: parkIds.map((id) => new Types.ObjectId(id)),
                    },
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

import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsService } from './assignments.service';
import { getModelToken } from '@nestjs/mongoose';
import { Assignment } from './schema/assignment.schema';
import { DBName } from '../utils/connectDB';
import { ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('AssignmentsService', () => {
    let service: AssignmentsService;

    const mockAssignmentModel = {
        findOne: jest.fn(),
        create: jest.fn(),
        findOneAndDelete: jest.fn(),
        find: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AssignmentsService,
                {
                    provide: getModelToken(
                        Assignment.name,
                        DBName.omniparkIDSystem,
                    ),
                    useValue: mockAssignmentModel,
                },
            ],
        }).compile();

        service = module.get<AssignmentsService>(AssignmentsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('assignPark', () => {
        it('should successfully create an assignment', async () => {
            const tenantCode = new Types.ObjectId();
            const pocId = new Types.ObjectId();
            const parkId = new Types.ObjectId();
            const assignedBy = new Types.ObjectId();
            const schedule = {
                startTime: new Date('2026-01-01T00:00:00.000Z'),
                endTime: new Date('2026-01-31T23:59:59.000Z'),
            };
            mockAssignmentModel.findOne.mockResolvedValue(null);
            mockAssignmentModel.create.mockResolvedValue({
                _id: 'assignment1',
                pocId,
                parkId,
            });

            const result = await service.assignPark({
                tenantCode,
                pocId,
                parkId,
                assignedBy,
                schedule,
            });

            expect(result).toEqual(
                expect.objectContaining({ _id: 'assignment1' }),
            );
            expect(mockAssignmentModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    tenantCode,
                    pocId,
                    parkId,
                    assignedBy,
                    schedule,
                }),
            );
        });

        it('should throw ConflictException if assignment exists', async () => {
            mockAssignmentModel.findOne.mockResolvedValue({ _id: 'existing1' });

            await expect(
                service.assignPark({
                    tenantCode: new Types.ObjectId(),
                    pocId: new Types.ObjectId(),
                    parkId: new Types.ObjectId(),
                    assignedBy: new Types.ObjectId(),
                    schedule: {
                        startTime: new Date('2026-01-01T00:00:00.000Z'),
                        endTime: new Date('2026-01-31T23:59:59.000Z'),
                    },
                }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('unassignPark', () => {
        it('should call findOneAndDelete', async () => {
            const pocId = new Types.ObjectId().toString();
            const parkId = new Types.ObjectId().toString();
            mockAssignmentModel.findOneAndDelete.mockResolvedValue({
                _id: 'assignment1',
            });
            const result = await service.unassignPark(pocId, parkId);
            expect(result).toEqual(
                expect.objectContaining({ _id: 'assignment1' }),
            );
            expect(mockAssignmentModel.findOneAndDelete).toHaveBeenCalledWith({
                pocId: new Types.ObjectId(pocId),
                parkId: new Types.ObjectId(parkId),
            });
        });
    });

    describe('getPocAssignments', () => {
        it('should fetch assignments enforcing schedule constraints', async () => {
            const pocId = new Types.ObjectId().toString();
            const mockData = [{ parkId: 'park1' }, { parkId: 'park2' }];
            mockAssignmentModel.lean.mockResolvedValue(mockData);

            const result = await service.getPocAssignments(pocId);
            expect(result).toEqual(mockData);
            expect(mockAssignmentModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    pocId: new Types.ObjectId(pocId),
                    $or: expect.any(Array),
                    $and: expect.any(Array),
                }),
            );
        });
    });
});

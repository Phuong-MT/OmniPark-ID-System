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
            mockAssignmentModel.findOne.mockResolvedValue(null);
            const expectedPayload = { pocId: 'poc1', parkId: 'park1' };
            mockAssignmentModel.create.mockResolvedValue({
                _id: 'assignment1',
                ...expectedPayload,
            });

            const result = await service.assignPark({
                tenantCode: new Types.ObjectId(),
                pocId: 'poc1',
                parkId: 'park1',
                assignedBy: 'admin1',
            });

            expect(result).toEqual(
                expect.objectContaining({ _id: 'assignment1' }),
            );
            expect(mockAssignmentModel.create).toHaveBeenCalled();
        });

        it('should throw ConflictException if assignment exists', async () => {
            mockAssignmentModel.findOne.mockResolvedValue({ _id: 'existing1' });

            await expect(
                service.assignPark({
                    tenantCode: new Types.ObjectId(),
                    pocId: 'poc1',
                    parkId: 'park1',
                    assignedBy: 'admin1',
                }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('unassignPark', () => {
        it('should call findOneAndDelete', async () => {
            mockAssignmentModel.findOneAndDelete.mockResolvedValue({
                _id: 'assignment1',
            });
            const result = await service.unassignPark('poc1', 'park1');
            expect(result).toEqual(
                expect.objectContaining({ _id: 'assignment1' }),
            );
            expect(mockAssignmentModel.findOneAndDelete).toHaveBeenCalledWith({
                pocId: 'poc1',
                parkId: 'park1',
            });
        });
    });

    describe('getPocAssignments', () => {
        it('should fetch assignments enforcing schedule constraints', async () => {
            const mockData = [{ parkId: 'park1' }, { parkId: 'park2' }];
            mockAssignmentModel.lean.mockResolvedValue(mockData);

            const result = await service.getPocAssignments('poc1');
            expect(result).toEqual(mockData);
            expect(mockAssignmentModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    pocId: 'poc1',
                    $or: expect.any(Array),
                    $and: expect.any(Array),
                }),
            );
        });
    });
});

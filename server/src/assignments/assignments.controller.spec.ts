import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { HttpException } from '@nestjs/common';

describe('AssignmentsController', () => {
    let controller: AssignmentsController;

    const mockAssignmentsService = {
        assignPark: jest.fn(),
        unassignPark: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AssignmentsController],
            providers: [
                {
                    provide: AssignmentsService,
                    useValue: mockAssignmentsService,
                },
            ],
        }).compile();

        controller = module.get<AssignmentsController>(AssignmentsController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('assignPark', () => {
        it('should assign a park correctly', async () => {
            const schedule = {
                startTime: new Date('2026-01-01T00:00:00.000Z'),
                endTime: new Date('2026-01-31T23:59:59.000Z'),
            };
            const req = { user: { tenantCode: 'tenant1', userId: 'admin1' } };
            const body = { pocId: 'poc1', parkId: 'park1', schedule };
            mockAssignmentsService.assignPark.mockResolvedValue({
                _id: 'assignment1',
            });

            const result = await controller.assignPark(req, body);
            expect(result).toEqual({ _id: 'assignment1' });
            expect(mockAssignmentsService.assignPark).toHaveBeenCalledWith({
                tenantCode: 'tenant1',
                assignedBy: 'admin1',
                pocId: 'poc1',
                parkId: 'park1',
                schedule,
            });
        });

        it('should throw HttpException if pocId or parkId omitted', async () => {
            const req = { user: { tenantCode: 'tenant1', userId: 'admin1' } };
            const body = { pocId: 'poc1', parkId: '' };

            await expect(controller.assignPark(req, body)).rejects.toThrow(
                HttpException,
            );
        });
    });

    describe('unassignPark', () => {
        it('should call unassignPark', async () => {
            mockAssignmentsService.unassignPark.mockResolvedValue({
                _id: 'assignment1',
            });
            const result = await controller.unassignPark('poc1', 'park1');
            expect(result).toEqual({ _id: 'assignment1' });
            expect(mockAssignmentsService.unassignPark).toHaveBeenCalledWith(
                'poc1',
                'park1',
            );
        });
    });
});

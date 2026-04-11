import { Test, TestingModule } from '@nestjs/testing';
import { ParksController } from './parks.controller';
import { ParksService } from './parks.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { UserRole } from '../user/schema/user.schema';

describe('ParksController', () => {
    let controller: ParksController;

    const mockParksService = {
        findParks: jest.fn(),
    };

    const mockAssignmentsService = {
        getPocAssignments: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ParksController],
            providers: [
                {
                    provide: ParksService,
                    useValue: mockParksService,
                },
                {
                    provide: AssignmentsService,
                    useValue: mockAssignmentsService,
                },
            ],
        }).compile();

        controller = module.get<ParksController>(ParksController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should query parks without POC filter for ADMIN', async () => {
            const req = {
                user: { role: UserRole.ADMIN, tenantCode: 'tenant1' },
            };
            mockParksService.findParks.mockResolvedValue({
                data: [],
                total: 0,
            });

            await controller.findAll(req, '1', '10');

            expect(
                mockAssignmentsService.getPocAssignments,
            ).not.toHaveBeenCalled();
            expect(mockParksService.findParks).toHaveBeenCalledWith(
                {
                    tenantCode: 'tenant1',
                    search: undefined,
                    status: undefined,
                    parkIds: undefined,
                },
                1,
                10,
            );
        });

        it('should query parks WITH POC filter for POC role', async () => {
            const req = {
                user: {
                    role: UserRole.POC,
                    tenantCode: 'tenant1',
                    _id: 'poc1',
                },
            };
            mockAssignmentsService.getPocAssignments.mockResolvedValue([
                { parkId: 'park1' },
            ]);
            mockParksService.findParks.mockResolvedValue({
                data: [],
                total: 0,
            });

            await controller.findAll(req, '1', '10');

            expect(
                mockAssignmentsService.getPocAssignments,
            ).toHaveBeenCalledWith('poc1');
            expect(mockParksService.findParks).toHaveBeenCalledWith(
                {
                    tenantCode: 'tenant1',
                    search: undefined,
                    status: undefined,
                    parkIds: ['park1'],
                },
                1,
                10,
            );
        });
    });
});

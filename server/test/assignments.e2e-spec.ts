import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AssignmentsModule } from '../src/assignments/assignments.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { getModelToken } from '@nestjs/mongoose';
import { Assignment } from '../src/assignments/schema/assignment.schema';
import { DBName } from '../src/utils/connectDB';
import { Types } from 'mongoose';

describe('AssignmentsController (e2e)', () => {
    let app: INestApplication;

    const mockAssignmentModel = {
        findOne: jest.fn(),
        create: jest.fn(),
        findOneAndDelete: jest.fn(),
        find: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
    };

    const mockAdminUser = {
        _id: new Types.ObjectId(),
        role: 'ADMIN',
        tenantCode: new Types.ObjectId(),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AssignmentsModule],
        })
        .overrideGuard(JwtAuthGuard).useValue({
            canActivate: (context) => {
                const req = context.switchToHttp().getRequest();
                req.user = mockAdminUser;
                return true;
            }
        })
        .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
        .overrideProvider(getModelToken(Assignment.name, DBName.omniparkIDSystem)).useValue(mockAssignmentModel)
        .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('/assignments (POST) - successfully assign park', () => {
        mockAssignmentModel.findOne.mockResolvedValue(null);
        mockAssignmentModel.create.mockResolvedValue({ _id: 'dummyAssignmentId' });

        return request(app.getHttpServer())
            .post('/assignments')
            .send({
                pocId: new Types.ObjectId().toString(),
                parkId: new Types.ObjectId().toString(),
                schedule: {
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + 86400000).toISOString()
                }
            })
            .expect(201)
            .expect((res) => {
                expect(res.body._id).toBe('dummyAssignmentId');
            });
    });

    it('/assignments (POST) - fails if assignment exists', () => {
        mockAssignmentModel.findOne.mockResolvedValue({ _id: 'existingAssignment' });

        return request(app.getHttpServer())
            .post('/assignments')
            .send({
                pocId: new Types.ObjectId().toString(),
                parkId: new Types.ObjectId().toString(),
            })
            .expect(409); // ConflictException
    });

    it('/assignments/:pocId/:parkId (DELETE) - successfully unassign', () => {
        mockAssignmentModel.findOneAndDelete.mockResolvedValue({ _id: 'deletedAssignment' });

        return request(app.getHttpServer())
            .delete(`/assignments/poc123/park123`)
            .expect(200);
    });
});

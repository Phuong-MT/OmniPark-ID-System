import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ParksModule } from '../src/parks/parks.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { getModelToken } from '@nestjs/mongoose';
import { Park } from '../src/parks/schema/park.schema';
import { Assignment } from '../src/assignments/schema/assignment.schema';
import { DBName } from '../src/utils/connectDB';
import { Types } from 'mongoose';
import { UserRole } from '../src/user/schema/user.schema';

describe('ParksController (e2e)', () => {
    let app: INestApplication;

    const mockParkModel = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: 'park1', name: 'Alpha Gate' }]),
        countDocuments: jest.fn().mockResolvedValue(1),
    };

    const mockAssignmentModel = {
        find: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ parkId: 'park1' }]),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ParksModule],
        })
        .overrideGuard(JwtAuthGuard).useValue({
            canActivate: (context) => {
                const req = context.switchToHttp().getRequest();
                // Default to POC for testing find filters
                req.user = {
                    _id: 'pocUserId',
                    role: UserRole.POC,
                    tenantCode: new Types.ObjectId(),
                };
                return true;
            }
        })
        .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
        .overrideProvider(getModelToken(Park.name, DBName.omniparkIDSystem)).useValue(mockParkModel)
        .overrideProvider(getModelToken(Assignment.name, DBName.omniparkIDSystem)).useValue(mockAssignmentModel)
        .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('/parks (GET) - fetching exactly assigned parks for POC', async () => {
        const response = await request(app.getHttpServer())
            .get('/parks?page=1&limit=10')
            .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(response.body.data[0].name).toBe('Alpha Gate');
        
        // Ensure model was called with _id filter containing park1
        expect(mockParkModel.find).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: { $in: ['park1'] }
            })
        );
    });
});

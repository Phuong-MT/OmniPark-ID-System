import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { DBName } from 'src/utils/connectDB';
import { Types } from 'mongoose';

describe('UserService', () => {
    let service: UserService;
    let model: any;

    beforeEach(async () => {
        const mockUserModel = {
            findOne: jest.fn(),
            findById: jest.fn(),
            exec: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getModelToken(User.name, DBName.omniparkIDSystem),
                    useValue: mockUserModel,
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        model = module.get(getModelToken(User.name, DBName.omniparkIDSystem));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findByUsername', () => {
        it('should find user by username', async () => {
            const mockResult = { username: 'testuser' };
            model.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockResult),
            });

            const result = await service.findByUsername('testuser');

            expect(model.findOne).toHaveBeenCalledWith({
                username: 'testuser',
            });
            expect(result).toEqual(mockResult);
        });

        it('should find user by username and tenantCode', async () => {
            const mockResult = { username: 'testuser' };
            model.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockResult),
            });
            const tenantCode = new Types.ObjectId().toHexString();

            const result = await service.findByUsername('testuser', tenantCode);

            expect(model.findOne).toHaveBeenCalledWith({
                username: 'testuser',
                tenantCode: new Types.ObjectId(tenantCode),
            });
            expect(result).toEqual(mockResult);
        });
    });

    describe('findById', () => {
        it('should find user by id', async () => {
            const mockResult = { _id: '123' };
            model.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockResult),
            });

            const result = await service.findById('123');

            expect(model.findById).toHaveBeenCalledWith('123');
            expect(result).toEqual(mockResult);
        });
    });
});

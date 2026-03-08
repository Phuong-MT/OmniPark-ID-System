import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '../user/schema/user.schema';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: any;
  let jwtService: any;
  let configService: any;

  beforeEach(async () => {
    userService = {
      findByUsername: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
    };
    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate and return user data', async () => {
      const mockUser = {
        _id: '123',
        tenantCode: 'tenant1',
        role: 'admin',
        status: UserStatus.ACTIVE,
        passwordHash: 'hashedPass',
      };
      userService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser({ username: 'test', password: 'password', tenantCode: 'tenant1' });

      expect(result).toEqual({ userId: '123', tenantId: 'tenant1', role: 'admin' });
      expect(userService.findByUsername).toHaveBeenCalledWith('test', 'tenant1');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPass');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userService.findByUsername.mockResolvedValue(null);

      await expect(service.validateUser({ username: 'test', password: 'password', tenantCode: 'tenant1' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is blocked', async () => {
      userService.findByUsername.mockResolvedValue({ status: UserStatus.BLOCKED });

      await expect(service.validateUser({ username: 'test', password: 'password', tenantCode: 'tenant1' })).rejects.toThrow('User is blocked');
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      userService.findByUsername.mockResolvedValue({ status: UserStatus.ACTIVE, passwordHash: 'hashedPass' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser({ username: 'test', password: 'password', tenantCode: 'tenant1' })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('login', () => {
    it('should return tokens on login', async () => {
      configService.get.mockReturnValue('secret');
      jwtService.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');

      const result = await service.login({ userId: '123', tenantId: 'tenant1', role: 'admin' });

      expect(result).toEqual({ accessToken: 'access_token', refreshToken: 'refresh_token' });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refresh', () => {
    it('should return new access token', async () => {
      configService.get.mockReturnValue('secret');
      jwtService.sign.mockReturnValue('new_access_token');

      const result = await service.refresh({ userId: '123', tenantId: 'tenant1', role: 'admin' });

      expect(result).toEqual({ accessToken: 'new_access_token' });
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
    });
  });
});

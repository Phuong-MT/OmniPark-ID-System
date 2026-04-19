import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { UserStatus } from '../user/schema/user.schema';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let userService: any;
    let jwtService: any;
    let configService: any;
    let mailService: any;

    beforeEach(async () => {
        userService = {
            findByUsername: jest.fn(),
            findByEmail: jest.fn(),
            saveVerificationCode: jest.fn(),
            clearVerificationCode: jest.fn(),
            updatePassword: jest.fn(),
        };
        jwtService = {
            sign: jest.fn(),
        };
        configService = {
            get: jest.fn(),
        };
        mailService = {
            sendVerificationCode: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UserService, useValue: userService },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },
                { provide: MailService, useValue: mailService },
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

            const result = await service.validateUser({
                username: 'test',
                password: 'password',
            });

            expect(result).toEqual({
                userId: '123',
                tenantCode: 'tenant1',
                role: 'admin',
            });
            expect(userService.findByUsername).toHaveBeenCalledWith(
                'test'
            );
            expect(bcrypt.compare).toHaveBeenCalledWith(
                'password',
                'hashedPass',
            );
        });

        it('should throw UnauthorizedException if user not found', async () => {
            userService.findByUsername.mockResolvedValue(null);

            await expect(
                service.validateUser({
                    username: 'test',
                    password: 'password',
                }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if user is blocked', async () => {
            userService.findByUsername.mockResolvedValue({
                status: UserStatus.BLOCKED,
            });

            await expect(
                service.validateUser({
                    username: 'test',
                    password: 'password',
                }),
            ).rejects.toThrow('User is blocked');
        });

        it('should throw UnauthorizedException if password invalid', async () => {
            userService.findByUsername.mockResolvedValue({
                status: UserStatus.ACTIVE,
                passwordHash: 'hashedPass',
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                service.validateUser({
                    username: 'test',
                    password: 'password',
                }),
            ).rejects.toThrow('Invalid credentials');
        });
    });

    describe('generateAndSendVerificationCode', () => {
        it('should generate code and send email', async () => {
            const mockUser = { _id: '123', status: UserStatus.ACTIVE };
            userService.findByEmail.mockResolvedValue(mockUser);
            userService.saveVerificationCode.mockResolvedValue(undefined);
            mailService.sendVerificationCode.mockResolvedValue(undefined);

            await service.generateAndSendVerificationCode('test@example.com');

            expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(userService.saveVerificationCode).toHaveBeenCalled();
            expect(mailService.sendVerificationCode).toHaveBeenCalledWith('test@example.com', expect.any(String));
        });

        it('should throw UnauthorizedException if user not found by email', async () => {
            userService.findByEmail.mockResolvedValue(null);
            await expect(service.generateAndSendVerificationCode('test@example.com')).rejects.toThrow('User with this email not found');
        });

        it('should throw if user is blocked', async () => {
            userService.findByEmail.mockResolvedValue({ status: UserStatus.BLOCKED });
            await expect(service.generateAndSendVerificationCode('test@example.com')).rejects.toThrow('User is blocked');
        });

        it('should clear code and throw Error if sending email fails', async () => {
            const mockUser = { _id: '123', status: UserStatus.ACTIVE };
            userService.findByEmail.mockResolvedValue(mockUser);
            mailService.sendVerificationCode.mockRejectedValue(new Error('SMTP Error'));

            await expect(service.generateAndSendVerificationCode('test@example.com')).rejects.toThrow('Could not send verification email. Please try again.');
            expect(userService.clearVerificationCode).toHaveBeenCalledWith('123');
        });
    });

    describe('validateCodeAndLogin', () => {
        const futureDate = new Date();
        futureDate.setMinutes(futureDate.getMinutes() + 5);

        const pastDate = new Date();
        pastDate.setMinutes(pastDate.getMinutes() - 5);

        it('should validate code and login', async () => {
            const mockUser = {
                _id: '123',
                tenantCode: 'tenant1',
                role: 'admin',
                status: UserStatus.ACTIVE,
                verificationCode: '123456',
                verificationCodeExpiresAt: futureDate,
            };
            userService.findByEmail.mockResolvedValue(mockUser);

            const result = await service.validateCodeAndLogin('test@example.com', '123456');

            expect(result).toEqual({ userId: '123', tenantCode: 'tenant1', role: 'admin' });
            expect(userService.clearVerificationCode).toHaveBeenCalledWith('123');
        });

        it('should throw if user not found', async () => {
            userService.findByEmail.mockResolvedValue(null);
            await expect(service.validateCodeAndLogin('test@example.com', '123456')).rejects.toThrow('Invalid email or code');
        });

        it('should throw if user blocked', async () => {
            userService.findByEmail.mockResolvedValue({ status: UserStatus.BLOCKED });
            await expect(service.validateCodeAndLogin('test@example.com', '123456')).rejects.toThrow('User is blocked');
        });

        it('should throw if code is invalid', async () => {
            const mockUser = { _id: '123', status: UserStatus.ACTIVE, verificationCode: '654321' };
            userService.findByEmail.mockResolvedValue(mockUser);
            await expect(service.validateCodeAndLogin('test@example.com', '123456')).rejects.toThrow('Invalid verification code');
        });

        it('should throw if code is expired', async () => {
            const mockUser = {
                _id: '123', status: UserStatus.ACTIVE, verificationCode: '123456', verificationCodeExpiresAt: pastDate
            };
            userService.findByEmail.mockResolvedValue(mockUser);
            await expect(service.validateCodeAndLogin('test@example.com', '123456')).rejects.toThrow('Verification code expired');
        });
    });

    describe('resetPassword', () => {
        const futureDate = new Date();
        futureDate.setMinutes(futureDate.getMinutes() + 5);

        it('should reset password completely', async () => {
            const mockUser = {
                _id: '123', status: UserStatus.ACTIVE, verificationCode: '123456', verificationCodeExpiresAt: futureDate
            };
            userService.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPass');

            await service.resetPassword({ email: 'test@example.com', code: '123456', newPassword: 'new' });

            expect(bcrypt.hash).toHaveBeenCalledWith('new', 'salt');
            expect(userService.updatePassword).toHaveBeenCalledWith('123', 'newHashedPass');
            expect(userService.clearVerificationCode).toHaveBeenCalledWith('123');
        });

        it('should throw if invalid code', async () => {
            const mockUser = { _id: '123', status: UserStatus.ACTIVE, verificationCode: '654321' };
            userService.findByEmail.mockResolvedValue(mockUser);
            await expect(service.resetPassword({ email: 'test@example.com', code: '123456', newPassword: 'new' })).rejects.toThrow('Invalid verification code');
        });
    });

    describe('login', () => {
        it('should return tokens on login', async () => {
            configService.get.mockReturnValue('secret');
            jwtService.sign
                .mockReturnValueOnce('access_token')
                .mockReturnValueOnce('refresh_token');

            const result = await service.login({
                userId: '123',
                tenantCode: 'tenant1',
                role: 'admin',
            });

            expect(result).toEqual({
                accessToken: 'access_token',
                refreshToken: 'refresh_token',
            });
            expect(jwtService.sign).toHaveBeenCalledTimes(2);
        });
    });

    describe('refresh', () => {
        it('should return new access token', async () => {
            configService.get.mockReturnValue('secret');
            jwtService.sign.mockReturnValue('new_access_token');

            const result = await service.refresh({
                userId: '123',
                tenantCode: 'tenant1',
                role: 'admin',
            });

            expect(result).toEqual({ accessToken: 'new_access_token' });
            expect(jwtService.sign).toHaveBeenCalledTimes(1);
        });
    });
});

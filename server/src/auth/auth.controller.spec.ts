import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: any;

    beforeEach(async () => {
        authService = {
            validateUser: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            generateAndSendVerificationCode: jest.fn(),
            resetPassword: jest.fn(),
            validateCodeAndLogin: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: authService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        it('should login and set cookies', async () => {
            const mockUser = { userId: '1', tenantCode: 't1', role: 'admin' };
            const tokens = { accessToken: 'access', refreshToken: 'refresh' };
            authService.validateUser.mockResolvedValue(mockUser);
            authService.login.mockResolvedValue(tokens);

            const mockRes = {
                cookie: jest.fn(),
            } as unknown as Response;

            const dto = { username: 'user1', password: 'password', tenantCode: 't1' };
            const result = await controller.login(dto, mockRes);

            expect(authService.validateUser).toHaveBeenCalledWith(dto);
            expect(authService.login).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual({ message: 'Login successful' });
            expect(mockRes.cookie).toHaveBeenCalledTimes(2);
            expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', 'access', expect.any(Object));
            expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'refresh', expect.any(Object));
        });
    });

    describe('sendVerificationCode', () => {
        it('should call generateAndSendVerificationCode', async () => {
            const dto = { email: 'test@example.com' };
            authService.generateAndSendVerificationCode.mockResolvedValue();

            const result = await controller.sendVerificationCode(dto);

            expect(authService.generateAndSendVerificationCode).toHaveBeenCalledWith('test@example.com');
            expect(result).toEqual({ message: 'Verification code sent successfully' });
        });
    });

    describe('sendForgotPasswordCode', () => {
        it('should call generateAndSendVerificationCode', async () => {
            const dto = { email: 'test@example.com' };
            authService.generateAndSendVerificationCode.mockResolvedValue();

            const result = await controller.sendForgotPasswordCode(dto);

            expect(authService.generateAndSendVerificationCode).toHaveBeenCalledWith('test@example.com');
            expect(result).toEqual({ message: 'Verification code sent successfully' });
        });
    });

    describe('resetPassword', () => {
        it('should call resetPassword', async () => {
            const dto = { email: 'test@example.com', code: '123456', newPassword: 'new' };
            authService.resetPassword.mockResolvedValue();

            const result = await controller.resetPassword(dto);

            expect(authService.resetPassword).toHaveBeenCalledWith(dto);
            expect(result).toEqual({ message: 'Password has been reset successfully' });
        });
    });

    describe('loginWithCode', () => {
        it('should login and set cookies', async () => {
            const mockUser = { userId: '1', tenantCode: 't1', role: 'admin' };
            const tokens = { accessToken: 'access', refreshToken: 'refresh' };
            authService.validateCodeAndLogin.mockResolvedValue(mockUser);
            authService.login.mockResolvedValue(tokens);

            const mockRes = {
                cookie: jest.fn(),
            } as unknown as Response;

            const dto = { email: 'test@example.com', code: '123456' };
            const result = await controller.loginWithCode(dto, mockRes);

            expect(authService.validateCodeAndLogin).toHaveBeenCalledWith('test@example.com', '123456');
            expect(authService.login).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual({ message: 'Login successful' });
            expect(mockRes.cookie).toHaveBeenCalledTimes(2);
        });
    });

    describe('refresh', () => {
        it('should refresh access token and set cookie', async () => {
            const user = { userId: '1', tenantCode: 't1', role: 'admin' };
            const mockReq = { user } as unknown as Request;
            const mockRes = { cookie: jest.fn() } as unknown as Response;

            authService.refresh.mockResolvedValue({ accessToken: 'new_access' });

            const result = await controller.refresh(mockReq, mockRes);

            expect(authService.refresh).toHaveBeenCalledWith(user);
            expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', 'new_access', expect.any(Object));
            expect(result).toEqual({ message: 'Token refreshed successfully' });
        });
    });

    describe('logout', () => {
        it('should clear cookies', async () => {
            const mockRes = { clearCookie: jest.fn() } as unknown as Response;

            const result = await controller.logout(mockRes);

            expect(mockRes.clearCookie).toHaveBeenCalledWith('accessToken', { path: '/' });
            expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
            expect(result).toEqual({ message: 'Logout successful' });
        });
    });
});

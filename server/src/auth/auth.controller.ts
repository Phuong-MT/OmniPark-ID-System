import { Controller, Post, Body, Res, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SendCodeDto, LoginWithCodeDto, ResetPasswordDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const user = await this.authService.validateUser(loginDto);
        const tokens = await this.authService.login(user);
        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
        });

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
        });

        return { message: 'Login successful' };
    }

    @Post('send-code')
    async sendVerificationCode(@Body() sendCodeDto: SendCodeDto) {
        await this.authService.generateAndSendVerificationCode(sendCodeDto.email);
        return { message: 'Verification code sent successfully' };
    }

    @Post('forgot-password/send-code')
    async sendForgotPasswordCode(@Body() sendCodeDto: SendCodeDto) {
        await this.authService.generateAndSendVerificationCode(sendCodeDto.email);
        return { message: 'Verification code sent successfully' };
    }

    @Post('forgot-password/reset')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        await this.authService.resetPassword(resetPasswordDto);
        return { message: 'Password has been reset successfully' };
    }

    @Post('login-with-code')
    async loginWithCode(
        @Body() loginWithCodeDto: LoginWithCodeDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const user = await this.authService.validateCodeAndLogin(
            loginWithCodeDto.email,
            loginWithCodeDto.code,
        );
        const tokens = await this.authService.login(user);
        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
        });

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
        });

        return { message: 'Login successful' };
    }

    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const user = req.user;
        const tokens = await this.authService.refresh(user);
        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
        });

        return { message: 'Token refreshed successfully' };
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/' });
        return { message: 'Logout successful' };
    }
}

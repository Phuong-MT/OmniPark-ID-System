import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../user/schema/user.schema';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async validateUser(loginDto: LoginDto): Promise<any> {
        const user = await this.userService.findByUsername(
            loginDto.username,
            loginDto.tenantCode,
        );

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.status === UserStatus.BLOCKED) {
            throw new UnauthorizedException('User is blocked');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return {
            userId: user._id.toString(),
            tenantId: user.tenantCode.toString(),
            role: user.role,
        };
    }

    async login(user: any) {
        const payload = {
            userId: user.userId,
            tenantId: user.tenantId,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    async refresh(user: any) {
        const payload = {
            userId: user.userId,
            tenantId: user.tenantId,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: '15m',
        });

        return {
            accessToken,
        };
    }
}

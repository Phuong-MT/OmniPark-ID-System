import { Controller, Logger, Get, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schema/user.schema';
import type { Request } from 'express';

@Controller('user')
export class UserController {
    private logger = new Logger(UserController.name);
    constructor(private readonly userService: UserService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.POC)
    @Get('me')
    async getProfile(@Req() req: Request) {
        const userId = (req.user as any)?.userId;
        if (!userId) {
            throw new NotFoundException('User not found in token');
        }
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        
        const userObj = user.toObject ? user.toObject() : user;
        const { passwordHash, verificationCode, verificationCodeExpiresAt, ...safeUser } = userObj as any;

        return {
            user: {
                id: safeUser._id,
                email: safeUser.email,
                name: safeUser.username,
            },
            role: (req.user as any)?.role,
        };
    }
}

import { Controller, Logger, Get, Post, UseGuards, Req, Body, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schema/user.schema';
import { InviteUserDto } from './dto/invite-user.dto';
import { AuthService } from '../auth/auth.service';
import type { Request } from 'express';

@Controller('user')
export class UserController {
    private logger = new Logger(UserController.name);
    constructor(
        private readonly userService: UserService,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
    ) { }

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

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post('invite')
    async inviteUser(@Req() req: Request, @Body() inviteUserDto: InviteUserDto) {
        const currentUser = req.user as any;
        let targetTenantId = currentUser?.tenantId;

        // If SUPER_ADMIN provides a specific tenantId, use it
        if (currentUser?.role === UserRole.SUPER_ADMIN && inviteUserDto.tenantId) {
            targetTenantId = inviteUserDto.tenantId;
        }

        const user = await this.userService.create(inviteUserDto, targetTenantId);

        // Generate and send verification code to the invited user
        await this.authService.generateAndSendVerificationCode(inviteUserDto.email);

        return { message: 'User invited successfully', userId: user._id };
    }
}

import { Controller, Logger, Get, Post, Put, UseGuards, Req, Body, NotFoundException, ConflictException, Inject, forwardRef, Query } from '@nestjs/common';
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
    @Roles(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.POC)
    @Put('me')
    async updateProfile(@Req() req: Request, @Body() updateData: { username?: string }) {
        const userId = (req.user as any)?.userId;
        if (!userId) {
            throw new NotFoundException('User not found in token');
        }
        
        if (updateData.username) {
            const existingUser = await this.userService.findByUsername(updateData.username);
            if (existingUser && existingUser._id.toString() !== userId) {
                throw new ConflictException('Username already taken');
            }
        }

        const user = await this.userService.updateProfile(userId, updateData);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const userObj = user.toObject ? user.toObject() : user;
        const { passwordHash, verificationCode, verificationCodeExpiresAt, ...safeUser } = userObj as any;

        return {
            message: 'Profile updated successfully',
            user: {
                id: safeUser._id,
                email: safeUser.email,
                name: safeUser.username,
            }
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
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Get()
    async findAll(
        @Req() req: Request,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('role') role?: string,
        @Query('tenantCode') tenantCode?: string,
        @Query('search') search?: string,
    ) {
        const currentUser = req.user as any;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;

        const result = await this.userService.findAll(
            pageNum,
            limitNum,
            role,
            tenantCode,
            currentUser?.role,
            currentUser?.tenantId,
            search
        );

        // Sanitize the users before returning
        const safeUsers = result.users.map(user => {
            const userObj = user.toObject ? user.toObject() : user;
            const { passwordHash, verificationCode, verificationCodeExpiresAt, ...safeUser } = userObj as any;
            return {
                id: safeUser._id,
                email: safeUser.email,
                name: safeUser.username, // Using username as name based on schema
                role: safeUser.role,
                status: safeUser.status,
                tenant: safeUser.tenant,
                createdAt: safeUser.createdAt,
            };
        });

        return {
            users: safeUsers,
            total: result.total,
            page: pageNum,
            limit: limitNum,
        };
    }
}

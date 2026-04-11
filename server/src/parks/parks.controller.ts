import { Controller, Get, Req, Query, UseGuards, Logger } from '@nestjs/common';
import { ParksService } from './parks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/schema/user.schema';

@Controller('parks')
export class ParksController {
    private readonly logger = new Logger(ParksController.name);

    constructor(private readonly parksService: ParksService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POC)
    @Get()
    async findAll(
        @Req() req,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('tenantCode') tenantCode?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
    ) {
        const user = req.user;
        const targetTenantCode = user.role === UserRole.SUPER_ADMIN ? tenantCode : user.tenantCode;
        
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        
        return this.parksService.findParks(
            { tenantCode: targetTenantCode, search, status },
            pageNum,
            limitNum
        );
    }
}

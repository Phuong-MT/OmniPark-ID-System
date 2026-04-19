import { Controller, Get, Post, Body, Req, Query, UseGuards, Logger } from '@nestjs/common';
import { ParksService } from './parks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/schema/user.schema';
import { AssignmentsService } from '../assignments/assignments.service';
import { CreateParkDto } from './dto/create-park.dto';

@Controller('parks')
export class ParksController {
    private readonly logger = new Logger(ParksController.name);

    constructor(
        private readonly parksService: ParksService,
        private readonly assignmentsService: AssignmentsService,
    ) {}

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
        const targetTenantCode =
            user.role === UserRole.SUPER_ADMIN ? tenantCode : user.tenantCode;

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;

        let parkIds: string[] | undefined = undefined;
        if (user.role === UserRole.POC) {
            const pocAssignments =
                await this.assignmentsService.getPocAssignments(user.userId);
            parkIds = pocAssignments.map((a) => a.parkId.toString());
        }

        return this.parksService.findParks(
            { tenantCode: targetTenantCode, search, status, parkIds },
            pageNum,
            limitNum,
        );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post()
    async create(@Req() req, @Body() createParkDto: CreateParkDto) {
        const user = req.user;
        return this.parksService.createPark({
            ...createParkDto,
            tenantCode: user.tenantCode,
        });
    }
}

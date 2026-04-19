import {
    Controller,
    Post,
    Body,
    Req,
    Delete,
    Param,
    Get,
    Query,
    UseGuards,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/schema/user.schema';

@Controller('assignments')
export class AssignmentsController {
    constructor(private readonly assignmentsService: AssignmentsService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post()
    async assignPark(
        @Req() req,
        @Body()
        body: {
            pocId: string;
            parkId: string;
            schedule?: { startTime?: Date; endTime?: Date };
        },
    ) {
        if (!body.pocId || !body.parkId) {
            throw new HttpException(
                'pocId and parkId are required',
                HttpStatus.BAD_REQUEST,
            );
        }

        return this.assignmentsService.assignPark({
            tenantCode: req.user.tenantCode,
            pocId: body.pocId,
            parkId: body.parkId,
            assignedBy: req.user.userId,
            schedule: body.schedule,
        });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Delete(':pocId/:parkId')
    async unassignPark(
        @Param('pocId') pocId: string,
        @Param('parkId') parkId: string,
    ) {
        return this.assignmentsService.unassignPark(pocId, parkId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('month')
    async getAssignmentsByMonth(
        @Req() req,
        @Query('year') year: string,
        @Query('month') month: string,
    ) {
        if (!year || !month) {
            throw new HttpException(
                'year and month are required',
                HttpStatus.BAD_REQUEST,
            );
        }

        return this.assignmentsService.getAssignmentsByMonth(
            req.user.tenantCode,
            parseInt(year),
            parseInt(month),
        );
    }
}

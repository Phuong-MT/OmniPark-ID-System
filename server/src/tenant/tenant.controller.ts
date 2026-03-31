import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/schema/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenant')
export class TenantController {
    constructor(private readonly tenantService: TenantService) {}

    @Roles(UserRole.SUPER_ADMIN)
    @Post()
    async create(@Body() createTenantDto: CreateTenantDto) {
        return this.tenantService.create(createTenantDto);
    }

    @Roles(UserRole.SUPER_ADMIN)
    @Get()
    async findAll() {
        return this.tenantService.findAll();
    }
}

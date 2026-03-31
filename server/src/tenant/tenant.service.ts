import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './schema/tenant.schema';
import { DBName } from 'src/utils/connectDB';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
    constructor(
        @InjectModel(Tenant.name, DBName.omniparkIDSystem)
        private tenantModel: Model<TenantDocument>,
    ) {}

    async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
        const existingTenant = await this.tenantModel.findOne({ name: createTenantDto.name }).exec();
        if (existingTenant) {
            throw new ForbiddenException('Tenant name already exists');
        }
        const createdTenant = new this.tenantModel(createTenantDto);
        return createdTenant.save();
    }

    async findAll(): Promise<Tenant[]> {
        return this.tenantModel.find().exec();
    }
}

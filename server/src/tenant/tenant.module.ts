import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from './schema/tenant.schema';
import { DBName } from 'src/utils/connectDB';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Tenant.name, schema: TenantSchema }],
      DBName.omniparkIDSystem,
    ),
  ],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {}

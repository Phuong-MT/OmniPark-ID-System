import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParksService } from './parks.service';
import { ParksController } from './parks.controller';
import { DBName } from '../utils/connectDB';
import { Park, ParkSchema } from './schema/park.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Park.name, schema: ParkSchema }], DBName.omniparkIDSystem),
  ],
  controllers: [ParksController],
  exports: [ParksService],
})
export class ParksModule {}

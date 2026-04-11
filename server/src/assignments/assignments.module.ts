import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { DBName } from '../utils/connectDB';
import { Assignment, AssignmentSchema } from './schema/assignment.schema';

@Module({
    imports: [
        MongooseModule.forFeature(
            [{ name: Assignment.name, schema: AssignmentSchema }],
            DBName.omniparkIDSystem,
        ),
    ],
    controllers: [AssignmentsController],
    providers: [AssignmentsService],
    exports: [AssignmentsService],
})
export class AssignmentsModule {}

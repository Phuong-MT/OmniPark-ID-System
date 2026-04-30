import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssignmentDocument = Assignment & Document;

@Schema({ timestamps: true })
export class Assignment {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
    tenantCode: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    pocId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Park' })
    parkId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    assignedBy?: Types.ObjectId;

    // Schedule the validity sequence of the assignment
    @Prop({
        type: {
            startTime: { type: Date, required: false },
            endTime: { type: Date, required: false },
        },
        default: {},
    })
    schedule?: {
        startTime?: Date;
        endTime?: Date;
    };
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

AssignmentSchema.index({ tenantCode: 1, pocId: 1, parkId: 1 });
AssignmentSchema.index({ pocId: 1 });

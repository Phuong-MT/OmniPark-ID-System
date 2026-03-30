import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({
    timestamps: true,
})
export class Tenant {
    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop()
    address?: string;

    @Prop()
    contactEmail?: string;

    @Prop()
    contactPhone?: string;

    @Prop({
        enum: ['ACTIVE', 'BLOCKED'],
        default: 'ACTIVE',
    })
    status: string;

    @Prop()
    subscriptionPlan?: string;

    @Prop()
    subscriptionExpireAt?: Date;

    @Prop()
    maxDevices?: number;

    @Prop()
    maxUsers?: number;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

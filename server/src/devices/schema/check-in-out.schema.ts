import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CheckInOutDocument = CheckInOut & Document;

@Schema({
    timestamps: true,
    collection: 'checkInOut',
})
export class CheckInOut {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
    tenantCode: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Device' })
    deviceId: Types.ObjectId; // Gate ID

    @Prop({ type: Types.ObjectId, ref: 'Device' })
    cameraId?: Types.ObjectId; // Camera LRP ID

    @Prop({ required: true, trim: true })
    cardId: string; // RFID Card ID

    @Prop({ trim: true, uppercase: true })
    plateNumber?: string; // Biển số xe nhận dạng được

    @Prop()
    confidence?: number; // Độ tin cậy của AI

    @Prop()
    snapshotUrl?: string; // Link ảnh lưu trên Cloudinary

    @Prop({ required: true, enum: ['ENTRY', 'EXIT'] })
    type: 'ENTRY' | 'EXIT'; // Chiều xe chạy
}

export const CheckInOutSchema = SchemaFactory.createForClass(CheckInOut);

CheckInOutSchema.index({ tenantCode: 1, createdAt: -1 });
CheckInOutSchema.index({ cardId: 1, createdAt: -1 });
CheckInOutSchema.index({ plateNumber: 1, createdAt: -1 });

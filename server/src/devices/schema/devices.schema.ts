import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceDocument = Device & Document;

export enum DeviceType {
  GATE = 'GATE',
  CAMERA_LRP = 'CAMERA_LRP',
  SENSOR = 'SENSOR',
  CAMERA_FACE = 'CAMERA_FACE',
}

export enum DeviceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

@Schema({
  timestamps: true,
  collection: 'devices',
})
export class Device {
  @Prop({
    required: false,
    trim: true,
  })
  deviceName: string; // ESP32_GATE_01

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
  })
  macAddress: string; // AA:BB:CC:DD:EE:FF

  @Prop({
    required: true,
    enum: DeviceType,
  })
  type: DeviceType;

  @Prop({
    required: false,
    index: true,
  })
  tenantCode: string; // PARKING_A / HOSPITAL_A

  @Prop({
    enum: DeviceStatus,
    default: DeviceStatus.ACTIVE,
    index: true,
  })
  status: DeviceStatus;

  //   @Prop()
  //   firmwareVersion?: string;

  //   @Prop()
  //   ipAddress?: string;

  @Prop()
  lastSeenAt?: Date;

  @Prop({ default: false })
  isOnline: boolean;

  // pair mode
  @Prop({ default: false })
  isPairing: boolean;

  @Prop({ required: true, })
  hostname: string;

  @Prop({ required: true, })
  localIp: string;

  @Prop({ required: true, })
  subnetMask: string;

  @Prop({ index: true })
  pairToken?: string;

  @Prop()
  pairTokenExpiresAt?: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ tenantCode: 1, type: 1 });
DeviceSchema.index({ tenantCode: 1, status: 1 });
DeviceSchema.index({ tenantCode: 1, isOnline: 1 });
DeviceSchema.index({ pairToken: 1 }, { sparse: true });
DeviceSchema.index({ macAddress: 1 }, { unique: true });

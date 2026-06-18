import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceDocument = Device & Document;

export enum DeviceType {
    GATE = 'GATE',
    CAMERA_LRP = 'CAMERA_LRP',
    SENSOR = 'SENSOR',
    CAMERA_FACE = 'CAMERA_FACE',
}

export enum GATE_TYPE{
    EXIT = 'EXIT',
    ENTRY = 'ENTRY'
}

export enum DeviceStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    BLOCKED = 'BLOCKED',
}

export enum DevicePairState {
    UNPAIRED = 'UNPAIRED',
    PAIRING = 'PAIRING',
    PAIRED = 'PAIRED',
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
        type: Types.ObjectId,
    })
    tenantCode?: Types.ObjectId;

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

    @Prop({ required: true })
    hostname: string;

    @Prop({ required: true })
    localIp: string;

    @Prop({ required: true })
    subnetMask: string;

    // pair mode
    @Prop({
        enum: DevicePairState,
        default: DevicePairState.UNPAIRED,
        index: true,
    })
    pairState: DevicePairState;

    @Prop()
    pairToken?: string;

    @Prop()
    pairTokenExpiresAt?: Date;

    // Parks Clusters embeded
    @Prop({ type: Types.ObjectId })
    clusterId?: Types.ObjectId;

    // cameraLPR reference for gate
    @Prop({
        type: [{
            _id: false,
            cameraId: {
                type: Types.ObjectId,
                ref: 'Device',
                required: true,
            },
            gateType: {
                type: String,
                enum: GATE_TYPE,
                required: true,
            },
        }],
        validate: {
            validator: (v: any[]) => v.length <= 2,
            message: 'Gate can have at most 2 LPR cameras',
        },
    })
    cameraLprs?: {
        cameraId: Types.ObjectId;
        gateType: GATE_TYPE;
    }[];
    // url for camera 
    @Prop({type: String})
    cameraUrl?: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ tenantCode: 1, type: 1 });
DeviceSchema.index({ tenantCode: 1, status: 1 });
DeviceSchema.index({ pairToken: 1 }, { unique: true, sparse: true });

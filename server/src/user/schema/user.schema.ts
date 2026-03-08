import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  POC = 'POC',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  PENDING = 'PENDING',
}

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantCode: Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Prop({
    type: {
      fullName: String,
      avatar: String,
    },
  })
  profile?: {
    fullName?: string;
    avatar?: string;
  };

  // audit
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // block info
  @Prop({ type: Types.ObjectId, ref: 'User' })
  blockedBy?: Types.ObjectId;

  @Prop()
  blockedAt?: Date;

  @Prop()
  blockReason?: string;

  // soft delete
  @Prop({ default: false })
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ tenantCode: 1, username: 1 }, { unique: true });

UserSchema.index({ tenantCode: 1, role: 1 });

UserSchema.index({ status: 1 });

UserSchema.index({ createdBy: 1 });

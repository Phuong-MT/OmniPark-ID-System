import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument, DeviceStatus } from './schema/devices.schema';
import { DBName } from 'src/utils/connectDB';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name, DBName.omniparkIDSystem)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  // =========================
  // CREATE DEVICE
  // =========================
  async createDevice(payload: {
    deviceId: string;
    macAddress: string;
    type: string;
    tenantCode: string;
    rootKeyHash: string;
    firmwareVersion?: string;
  }) {
    const exists = await this.deviceModel.exists({
      $or: [
        { deviceId: payload.deviceId },
        { macAddress: payload.macAddress.toUpperCase() },
      ],
    });

    if (exists) {
      throw new ConflictException('Device already exists');
    }

    const device = await this.deviceModel.create({
      ...payload,
      macAddress: payload.macAddress.toUpperCase(),
      status: DeviceStatus.ACTIVE,
      isOnline: false,
    });

    return device;
  }

  // =========================
  // FIND ALL (FILTER)
  // =========================
  async findDevices(query: {
    tenantCode: string;
    type?: string;
    status?: DeviceStatus;
    isOnline?: boolean;
  }) {
    const filter: any = {
      tenantCode: query.tenantCode,
    };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.isOnline !== undefined) filter.isOnline = query.isOnline;

    return this.deviceModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  // =========================
  // FIND BY ID
  // =========================
  async findByDeviceId(deviceId: string) {
    const device = await this.deviceModel.findOne({ deviceId }).lean();

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  // =========================
  // FIND BY MAC
  // =========================
  async findByMacAddress(macAddress: string) {
    const device = await this.deviceModel.findOne({ macAddress }).lean();

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  // =========================
  // FIND OR CREATE
  // =========================
  async findOrCreate(payload: {
    macAddress: string;
    type: string;
    deviceName: string;
    firmwareVersion?: string;
  }) {
    const device = await this.deviceModel.findOneAndUpdate(
      {
        macAddress: payload.macAddress.toUpperCase(),
      },
      {
        $setOnInsert: {
          macAddress: payload.macAddress.toUpperCase(),
          type: payload.type,
          status: DeviceStatus.ACTIVE,
          firmwareVersion: payload.firmwareVersion,
          deviceName: payload.deviceName,
        },
        $set: {
          lastSeenAt: new Date(),
          isOnline: true,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    return device;
  }

  // =========================
  // UPDATE ONLINE STATUS (MQTT heartbeat)
  // =========================
  async updateOnlineStatus(deviceId: string, isOnline: boolean) {
    return this.deviceModel.updateOne(
      { deviceId },
      {
        isOnline,
        lastSeenAt: new Date(),
      },
    );
  }
}

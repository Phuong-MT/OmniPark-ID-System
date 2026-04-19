import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
        });

        return device;
    }

    // =========================
    // FIND ALL (FILTER)
    // =========================
    async findDevices(
        query: {
            tenantCode?: string;
            type?: string;
            status?: DeviceStatus;
            isOnline?: boolean;
            search?: string;
        },
        page: number = 1,
        limit: number = 10,
    ) {
        const filter: any = {};
        if (query.tenantCode) {
            filter.tenantCode = new Types.ObjectId(query.tenantCode);
        }

        if (query.type) filter.type = query.type;
        if (query.status) filter.status = query.status;
        
        if (query.search) {
            filter.$or = [
                { deviceName: { $regex: query.search, $options: 'i' } },
                { macAddress: { $regex: query.search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.deviceModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.deviceModel.countDocuments(filter),
        ]);

        return {
            data,
            total,
            page,
            limit,
        };
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

        //
        subnetMask?: string;
        hostname?: string;
        localIp?: string;
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
                    hostname:
                        payload.hostname ||
                        `omnipark-${payload.macAddress.replace(/:/g, '').toLowerCase()}`,
                    localIp: payload.localIp,
                    subnetMask: payload.subnetMask,
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
    // HANDLE PAIR REQUEST (Forwarded by Gateway)
    // =========================
    async handlePairRequest(payload: {
        tenantCode: string;
        macAddress: string;
        type: string;
        deviceName?: string;
    }) {
        const macUpper = payload.macAddress.toUpperCase();
        const pairToken = Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase(); // Short-lived 8-char token
        const pairTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const device = await this.deviceModel.findOneAndUpdate(
            { macAddress: macUpper },
            {
                $setOnInsert: {
                    macAddress: macUpper,
                    type: payload.type,
                    tenantCode: new Types.ObjectId(payload.tenantCode),
                    status: DeviceStatus.INACTIVE, // Not active until token is confirmed
                    deviceName:
                        payload.deviceName ||
                        `NEW_${payload.type}_${macUpper.slice(-5)}`,
                    hostname: `omnipark-${macUpper.replace(/:/g, '').toLowerCase()}`,
                    localIp: '0.0.0.0',
                    subnetMask: '255.255.255.0',
                },
                $set: {
                    pairToken,
                    pairTokenExpiresAt,
                    isPairing: true,
                    lastSeenAt: new Date(),
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
    // ACTIVATE DEVICE (Confirm token)
    // =========================
    async activateDevice(macAddress: string, token: string) {
        const device = await this.deviceModel.findOne({
            macAddress: macAddress.toUpperCase(),
            pairToken: token,
            pairTokenExpiresAt: { $gt: new Date() },
        });

        if (!device) {
            throw new NotFoundException('Invalid or expired pair token');
        }

        device.status = DeviceStatus.ACTIVE;
        // device.isPairing = false;
        device.pairToken = undefined;
        device.pairTokenExpiresAt = undefined;
        device.lastSeenAt = new Date();

        await device.save();
        return device;
    }

    async updateHeartbeat(payload: { mac: string }): Promise<void> {
        const query = {};

        if (payload.mac) {
            query['macAddress'] = payload.mac.toUpperCase();
        }

        const device = this.deviceModel
            .findOneAndUpdate(query, {
                $set: {
                    lastSeenAt: new Date(),
                },
            })
            .exec();
    }

    /*
  Convert IP address to long integer
  */
    ipToLong(ipAddress: string): number {
        return (
            ipAddress
                .split('.')
                .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>>
            0
        ); // >>> 0 forces unsigned 32-bit int
    }
    isSameSubnet(ip1: string, ip2: string, subnetMask: string): boolean {
        try {
            const ip1Long = this.ipToLong(ip1);
            const ip2Long = this.ipToLong(ip2);
            const maskLong = this.ipToLong(subnetMask);

            return (ip1Long & maskLong) === (ip2Long & maskLong);
        } catch (error) {
            return false;
        }
    }
}

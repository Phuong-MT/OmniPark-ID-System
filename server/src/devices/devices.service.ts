import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    CameraDirection,
    CameraStreamProtocol,
    Device,
    DeviceDocument,
    DeviceStatus,
    DeviceType,
} from './schema/devices.schema';
import { DBName } from 'src/utils/connectDB';
import { CreateCameraDto, EdgeCameraConfig, UpdateCameraDto } from './dto/camera.dto';

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
            parkId?: string;
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
        if (query.parkId) {
            filter.parkId = new Types.ObjectId(query.parkId);
        }
        
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

    async findCameras(
        query: {
            tenantCode?: string;
            parkId?: string;
            edgeNodeId?: string;
            search?: string;
            parkIds?: string[];
        },
        page: number = 1,
        limit: number = 10,
    ) {
        const filter: any = {
            type: { $in: [DeviceType.CAMERA_LRP, DeviceType.CAMERA_FACE] },
        };

        if (query.tenantCode) {
            filter.tenantCode = new Types.ObjectId(query.tenantCode);
        }
        if (query.parkId) {
            filter.parkId = new Types.ObjectId(query.parkId);
        }
        if (query.edgeNodeId) {
            filter['cameraConfig.edgeNodeId'] = query.edgeNodeId;
        }
        if (query.parkIds) {
            if (query.parkId) {
                filter.parkId = query.parkIds.includes(query.parkId)
                    ? new Types.ObjectId(query.parkId)
                    : { $in: [] };
            } else {
                filter.parkId = {
                    $in: query.parkIds.map((id) => new Types.ObjectId(id)),
                };
            }
        }
        if (query.search) {
            filter.$or = [
                { deviceName: { $regex: query.search, $options: 'i' } },
                { macAddress: { $regex: query.search, $options: 'i' } },
                { 'cameraConfig.edgeNodeId': { $regex: query.search, $options: 'i' } },
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

        return { data, total, page, limit };
    }

    async createCamera(payload: CreateCameraDto & { tenantCode?: string }) {
        this.assertCameraPayload(payload);

        const macUpper = payload.macAddress.toUpperCase();
        const exists = await this.deviceModel.exists({ macAddress: macUpper });
        if (exists) {
            throw new ConflictException('Camera with this MAC address already exists');
        }

        return this.deviceModel.create({
            deviceName: payload.deviceName,
            macAddress: macUpper,
            type: payload.type,
            tenantCode: new Types.ObjectId(payload.tenantCode),
            parkId: new Types.ObjectId(payload.parkId),
            clusterId: payload.clusterId
                ? new Types.ObjectId(payload.clusterId)
                : undefined,
            status: DeviceStatus.ACTIVE,
            hostname: `camera-${macUpper.replace(/:/g, '').toLowerCase()}`,
            localIp: '0.0.0.0',
            subnetMask: '255.255.255.0',
            cameraConfig: {
                streamUrl: payload.streamUrl,
                streamProtocol: CameraStreamProtocol.RTSP,
                direction: payload.direction,
                enabled: payload.enabled ?? true,
                edgeNodeId: payload.edgeNodeId,
                aiEnabled: payload.aiEnabled ?? true,
            },
        });
    }

    async updateCamera(id: string, payload: UpdateCameraDto, tenantCode?: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid camera ID format');
        }

        const update: any = {};
        if (payload.deviceName !== undefined) update.deviceName = payload.deviceName;
        if (payload.type !== undefined) {
            if (!this.isCameraType(payload.type)) {
                throw new BadRequestException('Invalid camera type');
            }
            update.type = payload.type;
        }
        if (payload.parkId !== undefined) {
            if (!Types.ObjectId.isValid(payload.parkId)) {
                throw new BadRequestException('Invalid park ID format');
            }
            update.parkId = new Types.ObjectId(payload.parkId);
        }
        if (payload.clusterId !== undefined) {
            update.clusterId = payload.clusterId
                ? new Types.ObjectId(payload.clusterId)
                : undefined;
        }

        const cameraConfig: Record<string, any> = {};
        if (payload.streamUrl !== undefined) cameraConfig.streamUrl = payload.streamUrl;
        if (payload.direction !== undefined) cameraConfig.direction = payload.direction;
        if (payload.edgeNodeId !== undefined) cameraConfig.edgeNodeId = payload.edgeNodeId;
        if (payload.enabled !== undefined) cameraConfig.enabled = payload.enabled;
        if (payload.aiEnabled !== undefined) cameraConfig.aiEnabled = payload.aiEnabled;

        const setPayload: any = { ...update };
        Object.entries(cameraConfig).forEach(([key, value]) => {
            setPayload[`cameraConfig.${key}`] = value;
        });

        const filter: any = {
            _id: new Types.ObjectId(id),
            type: { $in: [DeviceType.CAMERA_LRP, DeviceType.CAMERA_FACE] },
        };
        if (tenantCode) {
            filter.tenantCode = new Types.ObjectId(tenantCode);
        }

        const camera = await this.deviceModel
            .findOneAndUpdate(
                filter,
                { $set: setPayload },
                { new: true },
            )
            .lean();

        if (!camera) {
            throw new NotFoundException('Camera not found');
        }

        return camera;
    }

    async getEdgeCameraConfig(query: {
        edgeNodeId?: string;
        parkId?: string;
    }): Promise<EdgeCameraConfig[]> {
        const filter: any = {
            type: { $in: [DeviceType.CAMERA_LRP, DeviceType.CAMERA_FACE] },
            status: DeviceStatus.ACTIVE,
            'cameraConfig.enabled': true,
            'cameraConfig.aiEnabled': true,
            'cameraConfig.streamUrl': { $exists: true, $ne: '' },
        };

        if (query.edgeNodeId) {
            filter['cameraConfig.edgeNodeId'] = query.edgeNodeId;
        }
        if (query.parkId) {
            filter.parkId = new Types.ObjectId(query.parkId);
        }

        const cameras = await this.deviceModel.find(filter).lean();
        return cameras.map((camera: any) => ({
            id: camera._id.toString(),
            url: camera.cameraConfig.streamUrl,
            direction: camera.cameraConfig.direction || CameraDirection.BOTH,
            parkId: camera.parkId?.toString(),
            clusterId: camera.clusterId?.toString(),
            type: camera.type,
        }));
    }

    async validateEdgeCameraEvent(cameraId: string) {
        if (!Types.ObjectId.isValid(cameraId)) {
            throw new BadRequestException('Invalid camera ID format');
        }

        const camera = await this.deviceModel
            .findOne({
                _id: new Types.ObjectId(cameraId),
                type: { $in: [DeviceType.CAMERA_LRP, DeviceType.CAMERA_FACE] },
                status: DeviceStatus.ACTIVE,
                'cameraConfig.enabled': true,
            })
            .lean();

        if (!camera) {
            throw new NotFoundException('Camera not found or inactive');
        }

        await this.deviceModel.updateOne(
            { _id: camera._id },
            { $set: { 'cameraConfig.lastHealthAt': new Date() } },
        );

        return camera;
    }

    private assertCameraPayload(payload: CreateCameraDto & { tenantCode?: string }) {
        if (!this.isCameraType(payload.type)) {
            throw new BadRequestException('Invalid camera type');
        }
        if (!Types.ObjectId.isValid(payload.tenantCode)) {
            throw new BadRequestException('Invalid tenant ID format');
        }
        if (!Types.ObjectId.isValid(payload.parkId)) {
            throw new BadRequestException('Invalid park ID format');
        }
        if (payload.clusterId && !Types.ObjectId.isValid(payload.clusterId)) {
            throw new BadRequestException('Invalid cluster ID format');
        }
        if (!payload.streamUrl?.startsWith('rtsp://')) {
            throw new BadRequestException('RTSP stream URL is required');
        }
    }

    private isCameraType(type: string) {
        return [DeviceType.CAMERA_LRP, DeviceType.CAMERA_FACE].includes(
            type as DeviceType,
        );
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

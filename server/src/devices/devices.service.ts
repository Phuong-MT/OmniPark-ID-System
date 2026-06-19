import {
    Injectable,
    ConflictException,
    NotFoundException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    Device,
    DeviceDocument,
    DeviceStatus,
    DevicePairState,
    DeviceType,
    GATE_TYPE
} from './schema/devices.schema';
import { DBName } from 'src/utils/connectDB';
import { Park, ParkDocument } from 'src/parks/schema/park.schema';
import { MqttService } from 'src/mqtt/mqtt.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class DevicesService {
    constructor(
        @InjectModel(Device.name, DBName.omniparkIDSystem)
        private readonly deviceModel: Model<DeviceDocument>,
        @InjectModel(Park.name, DBName.omniparkIDSystem)
        private readonly parkModel: Model<ParkDocument>,
        @Inject(forwardRef(() => MqttService))
        private readonly mqttService: MqttService,
    ) {}

    private gateway: SocketGateway;

    registerGateway(gateway: SocketGateway) {
        this.gateway = gateway;
    }

    // =========================
    // CREATE DEVICE
    // =========================
    async createDevice(payload: {
        deviceId: string;
        macAddress: string;
        type: DeviceType;
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
            clusterIds?: string[] | Types.ObjectId[];
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

        if (query.clusterIds) {
            if (query.clusterIds.length > 0) {
                filter.clusterId = {
                    $in: query.clusterIds.map((id) => new Types.ObjectId(id)),
                };
            } else {
                filter.clusterId = { $in: [] };
            }
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

    async registerPairRequest(mac: string, sectionId: string, type: string) {
        const macUpper = mac.toUpperCase();
        const pairTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await this.deviceModel.findOneAndUpdate(
            { macAddress: macUpper },
            {
                $setOnInsert: {
                    type: type,
                    status: DeviceStatus.INACTIVE,
                },
                $set: {
                    pairToken: sectionId,
                    pairTokenExpiresAt,
                    pairState: DevicePairState.PAIRING,
                    lastSeenAt: new Date(),
                },
            },
            {
                new: true,
            },
        );
    }

    async getPairingDevices() {
        return this.deviceModel
            .find({
                pairState: DevicePairState.PAIRING,
                pairTokenExpiresAt: { $gt: new Date() },
            })
            .lean();
    }

    async initiatePairConfirm(
        macAddress: string,
        objectId: string,
        sectionId: string,
    ) {
        const device = await this.deviceModel.findOne({
            macAddress: macAddress.toUpperCase(),
            pairState: DevicePairState.PAIRING,
            pairToken: sectionId,
            pairTokenExpiresAt: { $gt: new Date() },
        });

        if (!device) {
            throw new NotFoundException(
                'Device not found or not in pairing state, or session expired',
            );
        }

        const confirmTopic = `iot/device/${macAddress.toUpperCase()}/pair-confirm`;
        const payload = {
            objectId: objectId,
            token: sectionId,
        };
        this.mqttService.publish(confirmTopic, payload);
    }

    async confirmPair(mac: string, objectId: string, token: string) {
        const device = await this.deviceModel.findOne({
            macAddress: mac.toUpperCase(),
            pairState: DevicePairState.PAIRING,
            pairToken: token,
            pairTokenExpiresAt: { $gt: new Date() },
        });

        if (!device) {
            throw new NotFoundException(
                'Device not found, expired, or invalid token',
            );
        }

        let tenantCode = device.tenantCode;
        if (Types.ObjectId.isValid(objectId)) {
            const park = await this.parkModel.findOne({
                'clusters._id': new Types.ObjectId(objectId),
            });
            if (park) {
                tenantCode = park.tenantCode;
            }
        }

        device.pairState = DevicePairState.PAIRED;
        device.status = DeviceStatus.ACTIVE;
        device.clusterId = new Types.ObjectId(objectId);
        if (tenantCode) {
            device.tenantCode = tenantCode;
        }
        device.pairToken = undefined;
        device.pairTokenExpiresAt = undefined;
        device.lastSeenAt = new Date();

        await device.save();

        // Update stats for cluster and park
        if (Types.ObjectId.isValid(objectId)) {
            const clusterIdObj = new Types.ObjectId(objectId);
            const totalDevicesInCluster = await this.deviceModel.countDocuments({ clusterId: clusterIdObj });
            
            // Update cluster stats in the park
            const updatedPark = await this.parkModel.findOneAndUpdate(
                { 'clusters._id': clusterIdObj },
                { $set: { 'clusters.$.stats.totalDevices': totalDevicesInCluster } },
                { new: true }
            );

            if (updatedPark) {
                // Calculate total devices for the park (sum of totalDevices across all clusters)
                const parkTotalDevices = updatedPark.clusters.reduce(
                    (sum, cluster) => sum + (cluster.stats?.totalDevices || 0),
                    0
                );
                
                await this.parkModel.updateOne(
                    { _id: updatedPark._id },
                    { $set: { 'stats.totalDevices': parkTotalDevices } }
                );
            }
        }

        if (this.gateway) {
            this.gateway.notifyPairSuccess(device.macAddress, device);
        }

        return {
            status: 'success',
            deviceId: device._id,
            deviceName: device.deviceName,
            tenantCode: device.tenantCode,
        };
    }

    async getClusterIdsFromParks(parkIds: string[]): Promise<Types.ObjectId[]> {
        if (!parkIds || parkIds.length === 0) return [];
        const parks = await this.parkModel
            .find({
                _id: { $in: parkIds.map((id) => new Types.ObjectId(id)) },
            })
            .select('clusters._id')
            .lean();

        const clusterIds: Types.ObjectId[] = [];
        for (const park of parks) {
            if (park.clusters) {
                for (const cluster of park.clusters) {
                    if (cluster._id) {
                        clusterIds.push(cluster._id);
                    }
                }
            }
        }
        return clusterIds;
    }

    async countDevices(query: {
        tenantCode?: string;
        clusterIds?: string[] | Types.ObjectId[];
        status?: DeviceStatus;
    }): Promise<number> {
        const filter: any = {};
        if (query.tenantCode) {
            filter.tenantCode = new Types.ObjectId(query.tenantCode);
        }
        if (query.status) {
            filter.status = query.status;
        }
        if (query.clusterIds) {
            if (query.clusterIds.length > 0) {
                filter.clusterId = {
                    $in: query.clusterIds.map((id) => new Types.ObjectId(id)),
                };
            } else {
                filter.clusterId = { $in: [] };
            }
        }
        return this.deviceModel.countDocuments(filter);
    }

    // =========================
    // ADD CAMERA LPR TO GATE
    // =========================
    async addCameraToGate(payload: {
        gateId: string;
        gateType: GATE_TYPE;
        cameraUrl: string;
        deviceName?: string;
        macAddress: string;
        hostname?: string;
        localIp?: string;
        subnetMask?: string;
    }) {
        const gate = await this.deviceModel.findById(payload.gateId);
        if (!gate) {
            throw new NotFoundException('Gate device not found');
        }
        if (gate.type !== DeviceType.GATE) {
            throw new Error('Target device is not a GATE');
        }

        const cameraLprs = gate.cameraLprs || [];
        if (cameraLprs.length >= 2) {
            throw new Error('Gate already has the maximum of 2 LPR cameras');
        }

        // Check duplicate gateType slot
        const alreadyHasType = cameraLprs.some((c) => c.gateType === payload.gateType);
        if (alreadyHasType) {
            throw new Error(`Gate already has a ${payload.gateType} camera assigned`);
        }

        // Create the camera device inheriting gate's tenant + cluster
        const macUpper = payload.macAddress.toUpperCase();
        const existingCamera = await this.deviceModel.findOne({ macAddress: macUpper });
        let camera: DeviceDocument;

        if (existingCamera) {
            existingCamera.cameraUrl = payload.cameraUrl;
            if (payload.deviceName) existingCamera.deviceName = payload.deviceName;
            existingCamera.clusterId = gate.clusterId;
            existingCamera.tenantCode = gate.tenantCode;
            await existingCamera.save();
            camera = existingCamera;
        } else {
            camera = await this.deviceModel.create({
                macAddress: macUpper,
                type: DeviceType.CAMERA_LRP,
                deviceName: payload.deviceName || `CAM_LPR_${macUpper.slice(-5)}`,
                cameraUrl: payload.cameraUrl,
                hostname: payload.hostname || `cam-${macUpper.replace(/:/g, '').toLowerCase()}`,
                localIp: payload.localIp || '0.0.0.0',
                subnetMask: payload.subnetMask || '255.255.255.0',
                status: DeviceStatus.ACTIVE,
                pairState: DevicePairState.PAIRED,
                clusterId: gate.clusterId,
                tenantCode: gate.tenantCode,
            });
        }

        // Link camera to gate
        gate.cameraLprs = [
            ...cameraLprs,
            { cameraId: camera._id as Types.ObjectId, gateType: payload.gateType },
        ];
        await gate.save();

        return {
            gate: await this.deviceModel
                .findById(gate._id)
                .populate({
                    path: 'cameraLprs.cameraId',
                    model: 'Device',
                    select: 'deviceName macAddress cameraUrl localIp status type',
                })
                .lean(),
            camera,
        };
    }

    // =========================
    // GET CAMERA LPR FROM GATE
    // =========================
    async getCameraLRPs(query: {
        tenantCode?: string;
        parkId?: string;
        clusterIds?: string[];
    }): Promise<DeviceDocument[]> {
        const filter: any = {};

        let clusterIds = [];

        if (query.tenantCode) {
            filter.tenantCode = new Types.ObjectId(query.tenantCode);
        }

        if (query.parkId) {
            clusterIds = await this.getClusterIdsFromParks([query.parkId]);
        }

        clusterIds = [
            ...new Set([
                ...clusterIds,
                ...(query.clusterIds || []),
            ]),
        ];

        if (clusterIds.length > 0) {
            filter.clusterId = {
                $in: clusterIds.map((id) => new Types.ObjectId(id)),
            };
        }

        return this.deviceModel
            .find({
                type: DeviceType.CAMERA_LRP,
                ...filter,
            })
            .lean();
    }
}

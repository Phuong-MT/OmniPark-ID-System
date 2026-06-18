import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DBName } from '../utils/connectDB';
import { Park, ParkDocument } from './schema/park.schema';

@Injectable()
export class ParksService {
    private readonly logger = new Logger(ParksService.name);
    constructor(
        @InjectModel(Park.name, DBName.omniparkIDSystem)
        private readonly parkModel: Model<ParkDocument>,
    ) {}

    async findParks(
        query: {
            tenantCode?: string;
            search?: string;
            status?: string;
            parkIds?: string[];
        },
        page: number = 1,
        limit: number = 10,
    ) {
        const filter: any = {};
        if (query.tenantCode) {
            filter.tenantCode = new Types.ObjectId(query.tenantCode);
        }
        if (query.status) {
            filter.status = query.status;
        }
        if (query.parkIds && query.parkIds.length > 0) {
            filter._id = {
                $in: query.parkIds.map((id: string) => new Types.ObjectId(id)),
            };
        }
        if (query.parkIds && query.parkIds.length === 0) {
            // Force empty result if POC has no assignments
            filter._id = { $in: [] };
        }
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { description: { $regex: query.search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.parkModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.parkModel.countDocuments(filter),
        ]);

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async getParkById(id: string, tenantCode?: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid Park ID format');
        }
        const filter: any = { _id: new Types.ObjectId(id) };
        if (tenantCode) {
            filter.tenantCode = new Types.ObjectId(tenantCode);
        }
        const park = await this.parkModel.findOne(filter).lean();
        if (!park) {
            throw new NotFoundException('Park not found');
        }
        return park;
    }

    async createPark(createParkDto: {
        tenantCode: any;
        name: string;
        description?: string;
    }) {
        const existingPark = await this.parkModel.findOne({
            name: createParkDto.name,
            tenantCode: createParkDto.tenantCode,
        });
        if (existingPark) {
            throw new Error('Park already exists');
        }
        const payload = {
            ...createParkDto,
            tenantCode: new Types.ObjectId(createParkDto.tenantCode),
        };
        const newPark = new this.parkModel(payload);
        return newPark.save();
    }

    async uploadParkMap(
        parkId: string,
        tenantCode: string | undefined,
        images: {
            original: string;
            preview: string;
            thumbnail: string;
            publicId?: string;
            config?: {
                width: number;
                height: number;
                scale: number;
            };
        },
    ) {
        if (!Types.ObjectId.isValid(parkId)) {
            throw new BadRequestException('Invalid Park ID format');
        }
        const filter: any = { _id: new Types.ObjectId(parkId) };
        if (tenantCode) {
            filter.tenantCode = new Types.ObjectId(tenantCode);
        }

        const park = await this.parkModel.findOne(filter);
        if (!park) {
            throw new NotFoundException('Park not found');
        }

        const updated = await this.parkModel
            .findByIdAndUpdate(
                parkId,
                {
                    $set: {
                        'map.image.original': images.original,
                        'map.image.preview': images.preview,
                        'map.image.thumbnail': images.thumbnail,
                        'map.config.width': images.config.width,
                        'map.config.height': images.config.height,
                        'map.config.scale': images.config.scale,
                    },
                },
                { new: true },
            )
            .lean();

        this.logger.log(
            `Park ${parkId} map updated — original / preview / thumbnail saved`,
        );
        return updated;
    }

    async addCluster(
        parkId: string,
        tenantCode: string | undefined,
        createClusterDto: {
            name: string;
            position?: { x?: number; y?: number; lat?: number; lng?: number };
        },
    ) {
        if (!Types.ObjectId.isValid(parkId)) {
            throw new BadRequestException('Invalid Park ID format');
        }
        const filter: any = { _id: new Types.ObjectId(parkId) };
        if (tenantCode) {
            filter.tenantCode = new Types.ObjectId(tenantCode);
        }

        const newClusterId = new Types.ObjectId();
        const newCluster = {
            _id: newClusterId,
            name: createClusterDto.name,
            position: createClusterDto.position || {
                x: 50,
                y: 50,
                lat: 0,
                lng: 0,
            },
            stats: {
                totalDevices: 0,
                onlineDevices: 0,
            },
            metadata: {},
        };

        const updated = await this.parkModel
            .findOneAndUpdate(
                filter,
                { $push: { clusters: newCluster } },
                { new: true },
            )
            .lean();

        if (!updated) {
            throw new NotFoundException('Park not found');
        }

        return updated;
    }

    async updateCluster(
        parkId: string,
        clusterId: string,
        tenantCode: string | undefined,
        updateClusterDto: {
            name?: string;
            position?: { x?: number; y?: number; lat?: number; lng?: number };
        },
    ) {
        if (
            !Types.ObjectId.isValid(parkId) ||
            !Types.ObjectId.isValid(clusterId)
        ) {
            throw new BadRequestException(
                'Invalid Park ID or Cluster ID format',
            );
        }
        const filter: any = { _id: new Types.ObjectId(parkId) };
        if (tenantCode) {
            filter.tenantCode = new Types.ObjectId(tenantCode);
        }

        const updateFields: any = {};
        if (updateClusterDto.name !== undefined) {
            updateFields['clusters.$[elem].name'] = updateClusterDto.name;
        }
        if (updateClusterDto.position !== undefined) {
            if (updateClusterDto.position.x !== undefined) {
                updateFields['clusters.$[elem].position.x'] =
                    updateClusterDto.position.x;
            }
            if (updateClusterDto.position.y !== undefined) {
                updateFields['clusters.$[elem].position.y'] =
                    updateClusterDto.position.y;
            }
            if (updateClusterDto.position.lat !== undefined) {
                updateFields['clusters.$[elem].position.lat'] =
                    updateClusterDto.position.lat;
            }
            if (updateClusterDto.position.lng !== undefined) {
                updateFields['clusters.$[elem].position.lng'] =
                    updateClusterDto.position.lng;
            }
        }

        if (Object.keys(updateFields).length === 0) {
            return this.getParkById(parkId, tenantCode);
        }

        const updated = await this.parkModel
            .findOneAndUpdate(
                filter,
                { $set: updateFields },
                {
                    arrayFilters: [
                        { 'elem._id': new Types.ObjectId(clusterId) },
                    ],
                    new: true,
                },
            )
            .lean();

        if (!updated) {
            throw new NotFoundException('Park or Cluster not found');
        }

        return updated;
    }

    async deleteCluster(
        parkId: string,
        clusterId: string,
        tenantCode: string | undefined,
    ) {
        if (
            !Types.ObjectId.isValid(parkId) ||
            !Types.ObjectId.isValid(clusterId)
        ) {
            throw new BadRequestException(
                'Invalid Park ID or Cluster ID format',
            );
        }
        const filter: any = { _id: new Types.ObjectId(parkId) };
        if (tenantCode) {
            filter.tenantCode = new Types.ObjectId(tenantCode);
        }

        const updated = await this.parkModel
            .findOneAndUpdate(
                filter,
                { $pull: { clusters: { _id: new Types.ObjectId(clusterId) } } },
                { new: true },
            )
            .lean();

        if (!updated) {
            throw new NotFoundException('Park not found');
        }

        return updated;
    }

    async countParks(
        query: {
            tenantCode?: string;
            parkIds?: string[];
        },
    ) {
        const filter: any = {};
        if (query.tenantCode) {
            filter.tenantCode = new Types.ObjectId(query.tenantCode);
        }
        if (query.parkIds && query.parkIds.length > 0) {
            filter._id = {
                $in: query.parkIds.map((id: string) => new Types.ObjectId(id)),
            };
        }
        if (query.parkIds && query.parkIds.length === 0) {
            // Force empty result if POC has no assignments
            filter._id = { $in: [] };
        }

        const count = await this.parkModel.countDocuments(filter);
        return count;
    }
}

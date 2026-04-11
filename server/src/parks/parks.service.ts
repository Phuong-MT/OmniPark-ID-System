import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DBName } from '../utils/connectDB';
import { Park, ParkDocument } from './schema/park.schema';

@Injectable()
export class ParksService {
    constructor(
        @InjectModel(Park.name, DBName.omniparkIDSystem)
        private readonly parkModel: Model<ParkDocument>,
    ) {}

    async findParks(
        query: {
            tenantCode?: string;
            search?: string;
            status?: string;
        },
        page: number = 1,
        limit: number = 10,
    ) {
        const filter: any = {};
        if (query.tenantCode) {
            filter.tenantCode = query.tenantCode;
        }
        if (query.status) {
            filter.status = query.status;
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
}

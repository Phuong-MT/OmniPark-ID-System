import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './schema/assignment.schema';
import { DBName } from '../utils/connectDB';

@Injectable()
export class AssignmentsService {
    constructor(
        @InjectModel(Assignment.name, DBName.omniparkIDSystem)
        private readonly assignmentModel: Model<AssignmentDocument>,
    ) {}

    async assignPark(payload: {
        tenantCode: Types.ObjectId | string;
        pocId: Types.ObjectId | string;
        parkId: Types.ObjectId | string;
        assignedBy: Types.ObjectId | string;
        schedule: { startTime: Date; endTime: Date };
    }) {
        const pocId = new Types.ObjectId(payload.pocId);
        const parkId = new Types.ObjectId(payload.parkId);
        const tenantCode = new Types.ObjectId(payload.tenantCode);
        
        const newStart = new Date(payload.schedule.startTime);
        const newEnd = new Date(payload.schedule.endTime);

        const existing = await this.assignmentModel.findOne({
            pocId,
            parkId,
            tenantCode,
            $or: [
                { 'schedule.startTime': { $exists: false } },
                { 'schedule.startTime': null },
                { 'schedule.endTime': { $exists: false } },
                { 'schedule.endTime': null },
                {
                    'schedule.startTime': { $lt: newEnd },
                    'schedule.endTime': { $gt: newStart },
                },
            ],
        });

        if (existing) {
            throw new ConflictException(
                'This park is already assigned to this POC during the specified time period.',
            );
        }

        return this.assignmentModel.create({
            ...payload,
            tenantCode,
            pocId,
            parkId,
            assignedBy: payload.assignedBy
                ? new Types.ObjectId(payload.assignedBy)
                : undefined,
        });
    }

    async unassignPark(pocId: string, parkId: string) {
        return this.assignmentModel.findOneAndDelete({
            pocId: new Types.ObjectId(pocId),
            parkId: new Types.ObjectId(parkId),
        });
    }

    async getPocAssignments(pocId: string | Types.ObjectId) {
        // Find active assignments considering schedule.
        const now = new Date();
        return this.assignmentModel
            .find({
                pocId: new Types.ObjectId(pocId),
                $or: [
                    { 'schedule.startTime': { $exists: false } },
                    { 'schedule.startTime': null },
                    { 'schedule.startTime': { $lte: now } },
                ],
                $and: [
                    {
                        $or: [
                            { 'schedule.endTime': { $exists: false } },
                            { 'schedule.endTime': null },
                            { 'schedule.endTime': { $gte: now } },
                        ],
                    },
                ],
            })
            .lean();
    }
    async getAssignmentsByMonth(
        tenantCode: string,
        year: number,
        month: number,
    ) {
        // month is 1-12.
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        return this.assignmentModel
            .find({
                tenantCode: new Types.ObjectId(tenantCode),
                $or: [
                    { 'schedule.startTime': { $exists: false } },
                    { 'schedule.startTime': null },
                    { 'schedule.startTime': { $lte: endDate } },
                ],
                $and: [
                    {
                        $or: [
                            { 'schedule.endTime': { $exists: false } },
                            { 'schedule.endTime': null },
                            { 'schedule.endTime': { $gte: startDate } },
                        ],
                    },
                ],
            })
            .populate('pocId', 'username profile')
            .lean();
    }
}

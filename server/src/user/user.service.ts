import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { DBName } from 'src/utils/connectDB';
import { InviteUserDto } from './dto/invite-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name, DBName.omniparkIDSystem)
        private readonly userModel: Model<UserDocument>,
    ) { }

    async findByUsername(
        username: string,
        tenantCode?: string,
    ): Promise<UserDocument | null> {
        const query: any = { username };
        if (tenantCode) {
            query.tenantCode = new Types.ObjectId(tenantCode);
        }
        return this.userModel.findOne(query).exec();
    }

    async create(dto: InviteUserDto, tenantCode: string): Promise<UserDocument> {
        const existingUsername = await this.userModel.findOne({ username: dto.username, tenantCode: new Types.ObjectId(tenantCode) }).exec();
        if (existingUsername) {
            throw new ConflictException('Username already exists');
        }

        const existingEmail = await this.userModel.findOne({ email: dto.email, tenantCode: new Types.ObjectId(tenantCode) }).exec();
        if (existingEmail) {
            throw new ConflictException('Email already exists');
        }

        const randomPassword = Math.random().toString(36).slice(-10) + 'A1!'; // Ensuring complex password requirements if any
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        const createdUser = new this.userModel({
            ...dto,
            tenantCode: new Types.ObjectId(tenantCode),
            passwordHash,
            status: 'ACTIVE',
        });

        return createdUser.save();
    }

    async findById(userId: string): Promise<UserDocument | null> {
        return this.userModel.findById(userId).exec();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async saveVerificationCode(userId: string, code: string, expiresAt: Date): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            verificationCode: code,
            verificationCodeExpiresAt: expiresAt,
        }).exec();
    }

    async clearVerificationCode(userId: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            $unset: { verificationCode: 1, verificationCodeExpiresAt: 1 },
        }).exec();
    }

    async updatePassword(userId: string, passwordHash: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            passwordHash,
        }).exec();
    }

    async updateProfile(userId: string, data: { username?: string }): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(userId, { $set: data }, { new: true }).exec();
    }

    async findAll(
        page: number,
        limit: number,
        role?: string,
        tenantCode?: string,
        currentUserRole?: string,
        currentUserTenantId?: string,
        search?: string
    ): Promise<{ users: UserDocument[], total: number }> {
        const query: any = {};

        if (role) {
            query.role = role;
        }

        // Apply tenant filter
        if (currentUserRole !== 'SUPER_ADMIN') {
            // Non-super-admins can only see users in their own tenant
            query.tenantCode = new Types.ObjectId(currentUserTenantId);
        } else if (tenantCode) {
            // SUPER_ADMINs can filter by provided tenantCode
            query.tenantCode = new Types.ObjectId(tenantCode);
        }

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const agg = [
            { $match: query },
            {
                $lookup: {
                    from: 'tenants',
                    localField: 'tenantCode',
                    foreignField: '_id',
                    pipeline: [
                        { $project: { name: 1, status: 1 } },
                    ],
                    as: 'tenant',
                },
            },
            { $unwind: '$tenant' },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    tenantCode: 0,
                },
            },
        ];

        const [users, total] = await Promise.all([
            this.userModel.aggregate(agg),
            this.userModel.countDocuments(query).exec(),
        ]);

        return { users, total };
    }
}

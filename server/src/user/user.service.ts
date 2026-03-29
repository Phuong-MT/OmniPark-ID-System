import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { DBName } from 'src/utils/connectDB';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name, DBName.omniparkIDSystem)
        private readonly userModel: Model<UserDocument>,
    ) {}

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

    async findById(userId: string): Promise<UserDocument | null> {
        return this.userModel.findById(userId).exec();
    }
}

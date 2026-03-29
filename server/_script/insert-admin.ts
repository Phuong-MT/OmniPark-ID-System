import { connect, disconnect, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { UserRole, UserStatus } from '../src/user/schema/user.schema';

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGO_URI_OMNIPARK_ID_SYSTEM;

async function run() {
  if (!uri) {
    console.error('MONGO_URI_OMNIPARK_ID_SYSTEM not found in .env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const mongoose = await connect(uri, {
    dbName: 'omnipark-id-system',
  });

  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Collections
    const tenantCollection = db.collection('tenants');
    const userCollection = db.collection('users');

    // Find or create a default tenant
    let tenant = await tenantCollection.findOne({ name: 'Ominipark' });
    if (!tenant) {
      console.log('Creating Default Tenant...');
      const result = await tenantCollection.insertOne({
        name: 'Ominipark',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      tenant = { _id: result.insertedId } as any;
    }

    const tenantId = tenant?._id;

    // Check if admin user exists
    const existingAdmin = await userCollection.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      return;
    }

    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash('admin@123', 10);

    console.log('Creating super admin user...');
    await userCollection.insertOne({
      tenantCode: new Types.ObjectId(tenantId),
      username: 'admin',
      email: 'admin@gmail.com',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Super admin user created successfully!');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    console.log('Disconnecting from database...');
    await disconnect();
  }
}

run();

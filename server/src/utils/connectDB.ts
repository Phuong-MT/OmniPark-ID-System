// connectDB.ts
import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

const logger = new Logger('ConnectDB');

export enum DBName {
  omniparkIDSystem = 'omnipark-id-system',
}
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI_OMNIPARK_ID_SYSTEM'),
        dbName: DBName.omniparkIDSystem,
        onConnectionCreate: (connection: Connection) => {
          if (connection) {
            logger.log('Omnipark-id-system database connected successfully');
          } else {
            logger.log('Omnipark-id-system connect failed');
          }
        },
      }),
      connectionName: DBName.omniparkIDSystem,
    }),
  ],
})
export class ConnectDBModule {}

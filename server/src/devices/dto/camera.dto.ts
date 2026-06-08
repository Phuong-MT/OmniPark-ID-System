import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import {
    CameraDirection,
    CameraStreamProtocol,
    DeviceType,
} from '../schema/devices.schema';

export class BulkCameraIdsDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(10)
    @IsMongoId({ each: true })
    ids: string[];
}

export class BulkUpdateCameraDto extends BulkCameraIdsDto {
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;

    @IsBoolean()
    @IsOptional()
    aiEnabled?: boolean;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    edgeNodeId?: string;
}

export class CreateCameraDto {
    @IsString()
    @IsNotEmpty()
    deviceName: string;

    @IsString()
    @IsNotEmpty()
    macAddress: string;

    @IsEnum(DeviceType)
    type: DeviceType.CAMERA_LRP | DeviceType.CAMERA_FACE;

    @IsMongoId()
    parkId: string;

    @IsMongoId()
    @IsOptional()
    tenantCode?: string;

    @IsMongoId()
    @IsOptional()
    clusterId?: string;

    @IsString()
    @IsNotEmpty()
    streamUrl: string;

    @IsEnum(CameraDirection)
    direction: CameraDirection;

    @IsString()
    @IsOptional()
    edgeNodeId?: string;

    @IsBoolean()
    @IsOptional()
    enabled?: boolean;

    @IsBoolean()
    @IsOptional()
    aiEnabled?: boolean;
}

export class UpdateCameraDto {
    @IsString()
    @IsOptional()
    deviceName?: string;

    @IsEnum(DeviceType)
    @IsOptional()
    type?: DeviceType.CAMERA_LRP | DeviceType.CAMERA_FACE;

    @IsMongoId()
    @IsOptional()
    parkId?: string;

    @IsMongoId()
    @IsOptional()
    clusterId?: string;

    @IsString()
    @IsOptional()
    streamUrl?: string;

    @IsEnum(CameraDirection)
    @IsOptional()
    direction?: CameraDirection;

    @IsString()
    @IsOptional()
    edgeNodeId?: string;

    @IsBoolean()
    @IsOptional()
    enabled?: boolean;

    @IsBoolean()
    @IsOptional()
    aiEnabled?: boolean;
}

export interface EdgeCameraConfig {
    id: string;
    url: string;
    direction: CameraDirection;
    parkId?: string;
    clusterId?: string;
    type: DeviceType;
}

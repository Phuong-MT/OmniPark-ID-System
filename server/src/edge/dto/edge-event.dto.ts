import { IsDateString, IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';

export enum EdgeEventType {
    PLATE_DETECTED = 'PLATE_DETECTED',
    VEHICLE_ENTERED = 'VEHICLE_ENTERED',
    VEHICLE_EXITED = 'VEHICLE_EXITED',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export class EdgeEventDto {
    @IsString()
    @IsNotEmpty()
    event_id: string;

    @IsDateString()
    timestamp: string;

    @IsEnum(EdgeEventType)
    type: EdgeEventType;

    @IsString()
    @IsNotEmpty()
    camera_id: string;

    @IsObject()
    payload: Record<string, any>;
}

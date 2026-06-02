import { IsString, IsNotEmpty, IsObject, IsOptional, IsNumber } from 'class-validator';

export class ClusterPositionDto {
    @IsNumber()
    @IsOptional()
    x?: number;

    @IsNumber()
    @IsOptional()
    y?: number;

    @IsNumber()
    @IsOptional()
    lat?: number;

    @IsNumber()
    @IsOptional()
    lng?: number;
}

export class CreateClusterDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsObject()
    @IsOptional()
    position?: ClusterPositionDto;
}

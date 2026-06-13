import { IsString, IsOptional, IsObject } from 'class-validator';
import { ClusterPositionDto } from './create-cluster.dto';

export class UpdateClusterDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsObject()
    @IsOptional()
    position?: ClusterPositionDto;
}

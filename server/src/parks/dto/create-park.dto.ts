import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateParkDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}

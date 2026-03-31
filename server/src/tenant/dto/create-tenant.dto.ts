import { IsString, IsOptional, IsEmail, IsNumber } from 'class-validator';

export class CreateTenantDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsOptional()
    @IsNumber()
    maxDevices?: number;

    @IsOptional()
    @IsNumber()
    maxUsers?: number;
}

import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class UploadParkMapDto {
    @IsString()
    @IsNotEmpty()
    @IsUrl()
    imageUrl: string;
}

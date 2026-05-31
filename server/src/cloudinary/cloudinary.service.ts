import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface ParkMapUploadResult {
    original: string;
    preview: string;   // 1024px wide
    thumbnail: string; // 256px wide
    publicId: string;
    config:{
        width: number,
        height: number,
        scale: number
    }
}

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    /**
     * Upload a buffer to Cloudinary and generate 3 variants in one request:
     *   - original  → giữ nguyên kích thước
     *   - preview   → max width 1024px
     *   - thumbnail → max width 256px
     */
    async uploadParkMapBuffer(
        buffer: Buffer,
        folder: string = 'omnipark/parks/maps',
        publicId?: string,
    ): Promise<ParkMapUploadResult> {
        const result = await this._uploadStream(buffer, {
            folder,
            public_id: publicId,
            resource_type: 'image',
            overwrite: true,
            // Generate preview + thumbnail eagerly so all 3 URLs are ready immediately
            eager: [
                { width: 1024, crop: 'limit', fetch_format: 'auto', quality: 'auto' }, // preview
                { width: 256,  crop: 'limit', fetch_format: 'auto', quality: 'auto' }, // thumbnail
            ],
            eager_async: false, // wait for eager transforms before responding
        });

        const preview   = result.eager?.[0]?.secure_url ?? result.secure_url;
        const thumbnail = result.eager?.[1]?.secure_url ?? result.secure_url;

        this.logger.log(
            `Uploaded park map [${result.public_id}] — original / preview / thumbnail ready`,
        );

        return {
            original:  result.secure_url,
            preview,
            thumbnail,
            publicId:  result.public_id,
            config:{
                width: result.eager?.[0].width,
                height: result.eager?.[0].height,
                scale:1
            }
        };
    }   

    /**
     * Delete an image from Cloudinary by publicId.
     */
    async deleteImage(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            this.logger.warn(
                `Failed to delete Cloudinary image: ${publicId}`,
                error,
            );
        }
    }

    // ─── private helpers ────────────────────────────────────────────────────

    private _uploadStream(
        buffer: Buffer,
        options: import('cloudinary').UploadApiOptions,
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                options,
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                },
            );
            const readable = new Readable();
            readable.push(buffer);
            readable.push(null);
            readable.pipe(stream);
        });
    }
}

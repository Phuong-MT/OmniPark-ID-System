import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Req,
    Query,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ParksService } from './parks.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/schema/user.schema';
import { AssignmentsService } from '../assignments/assignments.service';
import { CreateParkDto } from './dto/create-park.dto';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { UpdateClusterDto } from './dto/update-cluster.dto';

@Controller('parks')
export class ParksController {
    private readonly logger = new Logger(ParksController.name);

    constructor(
        private readonly parksService: ParksService,
        private readonly assignmentsService: AssignmentsService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POC)
    @Get()
    async findAll(
        @Req() req,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('tenantCode') tenantCode?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
    ) {
        const user = req.user;
        const targetTenantCode =
            user.role === UserRole.SUPER_ADMIN ? tenantCode : user.tenantCode;

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;

        let parkIds: string[] | undefined = undefined;
        if (user.role === UserRole.POC) {
            const pocAssignments =
                await this.assignmentsService.getPocAssignments(user.userId);
            parkIds = pocAssignments.map((a) => a.parkId.toString());
        }

        return this.parksService.findParks(
            { tenantCode: targetTenantCode, search, status, parkIds },
            pageNum,
            limitNum,
        );
    }

    // Get count total parks
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POC)
    @Get('count')
    async count(@Req() req){
        const user = req.user;
        const tenantCode =
            user.role === UserRole.SUPER_ADMIN ? undefined : user.tenantCode;

        let count = 0;
        if (user.role === UserRole.POC) {
            const pocAssignments =
                await this.assignmentsService.getPocAssignments(user.userId);
            const parkIds = pocAssignments.map((a) => a.parkId.toString());
            count = await this.parksService.countParks({
                parkIds: parkIds,
            });
        } else {
            count = await this.parksService.countParks({
                tenantCode: tenantCode,
            });
        }
        return count;
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post()
    async create(@Req() req, @Body() createParkDto: CreateParkDto) {
        const user = req.user;
        return this.parksService.createPark({
            ...createParkDto,
            tenantCode: user.tenantCode,
        });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POC)
    @Get(':id')
    async findOne(@Req() req, @Param('id') id: string) {
        const user = req.user;
        const tenantCode =
            user.role === UserRole.SUPER_ADMIN ? undefined : user.tenantCode;
        return this.parksService.getParkById(id, tenantCode);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Patch(':id/map')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
            fileFilter: (_req, file, callback) => {
                if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
                    return callback(
                        new BadRequestException('Only image files are allowed'),
                        false,
                    );
                }
                callback(null, true);
            },
        }),
    )
    async uploadMap(
        @Req() req,
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('Image file is required');
        }

        const user = req.user;
        const tenantCode =
            user.role === UserRole.SUPER_ADMIN ? undefined : user.tenantCode;

        // Upload to Cloudinary — generates original + preview (1024px) + thumbnail (256px)
        const { original, preview, thumbnail, publicId, config } =
            await this.cloudinaryService.uploadParkMapBuffer(
                file.buffer,
                'omnipark/parks/maps',
                `park_${id}_map`,
            );

        // Save all 3 URLs to DB
        return this.parksService.uploadParkMap(id, tenantCode, {
            original,
            preview,
            thumbnail,
            publicId,
            config,
        });
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POC)
    @Post(':parkId/clusters')
    async addCluster(
        @Req() req,
        @Param('parkId') parkId: string,
        @Body() createClusterDto: CreateClusterDto,
    ) {
        const user = req.user;
        const tenantCode =
            user.role === UserRole.SUPER_ADMIN ? undefined : user.tenantCode;
        return this.parksService.addCluster(
            parkId,
            tenantCode,
            createClusterDto,
        );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POC)
    @Patch(':parkId/clusters/:clusterId')
    async updateCluster(
        @Req() req,
        @Param('parkId') parkId: string,
        @Param('clusterId') clusterId: string,
        @Body() updateClusterDto: UpdateClusterDto,
    ) {
        const user = req.user;
        const tenantCode =
            user.role === UserRole.SUPER_ADMIN ? undefined : user.tenantCode;
        return this.parksService.updateCluster(
            parkId,
            clusterId,
            tenantCode,
            updateClusterDto,
        );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POC)
    @Delete(':parkId/clusters/:clusterId')
    async deleteCluster(
        @Req() req,
        @Param('parkId') parkId: string,
        @Param('clusterId') clusterId: string,
    ) {
        const user = req.user;
        const tenantCode =
            user.role === UserRole.SUPER_ADMIN ? undefined : user.tenantCode;
        return this.parksService.deleteCluster(parkId, clusterId, tenantCode);
    }
}

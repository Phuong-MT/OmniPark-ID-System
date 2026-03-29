import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {
                    let data = request?.cookies['accessToken'];
                    if (!data) {
                        return null;
                    }
                    return data;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey:
                configService.get<string>('JWT_SECRET') || 'defaultSecret',
        });
    }

    async validate(payload: any) {
        return {
            userId: payload.userId,
            tenantId: payload.tenantId,
            role: payload.role,
        };
    }
}

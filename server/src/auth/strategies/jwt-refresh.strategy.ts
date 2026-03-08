import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {
                    let data = request?.cookies['refreshToken'];
                    if (!data) {
                        return null;
                    }
                    return data;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'defaultSecret',
            passReqToCallback: true,
        });
    }

    async validate(request: any, payload: any) {
        const refreshToken = request?.cookies['refreshToken'];
        return {
            userId: payload.userId,
            tenantId: payload.tenantId,
            role: payload.role,
            refreshToken,
        };
    }
}

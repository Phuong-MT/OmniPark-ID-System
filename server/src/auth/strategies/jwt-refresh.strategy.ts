import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

function requireConfig(configService: ConfigService, key: string): string {
    const value = configService.get<string>(key);
    if (!value) {
        throw new Error(`${key} is required`);
    }
    return value;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
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
            secretOrKey: requireConfig(configService, 'JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
    }

    async validate(request: any, payload: any) {
        const refreshToken = request?.cookies['refreshToken'];
        return {
            userId: payload.userId,
            tenantCode: payload.tenantCode,
            role: payload.role,
            refreshToken,
        };
    }
}

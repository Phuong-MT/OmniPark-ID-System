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
            secretOrKey: requireConfig(configService, 'JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        return {
            userId: payload.userId,
            tenantCode: payload.tenantCode,
            role: payload.role,
        };
    }
}

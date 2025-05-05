import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.headers.authorization?.replace('Bearer ', '').trim(),
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'refresh-random',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    return {
      ...payload,
      refreshToken: req.headers.authorization?.replace('Bearer ', '').trim(),
    };
  }
}

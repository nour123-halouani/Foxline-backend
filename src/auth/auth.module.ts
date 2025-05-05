import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { JwtRefreshTokenStrategy } from 'src/common/strategies/jwt-refresh.strategy';
import { GoogleStrategy } from 'src/common/strategies/google.strategy';
import { FacebookStrategy } from 'src/common/strategies/facebook.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'facebook' })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshTokenStrategy, GoogleStrategy, FacebookStrategy],
})
export class AuthModule { }
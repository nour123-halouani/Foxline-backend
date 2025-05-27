import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthDto } from './dtos/auth.dto';
import { randomInt } from 'crypto';
import { transporter } from '../utils/nodemailer';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  async signup(dto: AuthDto) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ForbiddenException('emailExists');
      }

      const hash = await bcrypt.hash(dto.password, 10);

      const user = await prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
          name: dto.name,
          phone: dto.phone,
          role: dto.role,
          isCompany: Boolean(dto.isCompany),
        },
      });

      const tokens = await this.signTokens(user.id, user.email);

      return {
        message: 'accountCreated',
        ...tokens,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;

      console.error('Signup failed:', error);
      throw new InternalServerErrorException('serverError');
    }
  }

  async signin(dto: AuthDto) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (!user) throw new ForbiddenException('userNotFound');

      const match = await bcrypt.compare(dto.password, user.password);
      if (!match) throw new ForbiddenException('invalidCredentials');

      const tokens = await this.signTokens(user.id, user.email);

      return {
        message: 'welcomeBackFromBack',
        ...tokens,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;

      console.error('Signin failed:', error);
      throw new InternalServerErrorException('serverError');
    }
  }

  async signTokens(userId: number, email: string) {
    try {
      const payload = { id: userId, email };

      const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'access-random', {
        expiresIn: '1h',
      });
      const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-random', {
        expiresIn: '7d',
      });

      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken },
      });

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Sign tokens failed:', error);
      throw new InternalServerErrorException('serverError');
    }
  }

  async refreshTokens(userId: number, refreshToken: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new ForbiddenException('Access Denied');

      try {
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-random');
      } catch (err) {
        await prisma.user.update({
          where: { id: userId },
          data: { refreshToken: null },
        });
        throw new ForbiddenException('Refresh token expired or invalid');
      }

      if (user.refreshToken !== refreshToken) {
        throw new ForbiddenException('Refresh token mismatch');
      }

      return this.signTokens(user.id, user.email);
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;

      console.error('Refresh tokens failed:', error);
      throw new InternalServerErrorException('serverError');
    }
  }

  async logout(userId: number) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout failed:', error);
      throw new InternalServerErrorException('serverError');
    }
  }

  async sendResetCode(email: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new ForbiddenException('userNotFound');

      const code = randomInt(100000, 1000000);
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { email },
        data: { resetCode: code, resetCodeExpiry: expiry },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Reset Password',
        html: `Here is your initialization code : <b>${code}</b>`,
      });

      return { message: 'resetCodeSended' };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;

      console.error('Send reset code failed:', error);
      throw new InternalServerErrorException('serverError');
    }
  }

  async verifyResetCode(email: string, code: number) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.resetCode || !user.resetCodeExpiry)
        throw new ForbiddenException('invalidRequest');

      if (Number(user.resetCode) !== Number(code))
        throw new ForbiddenException('invalidCode');

      if (user.resetCodeExpiry < new Date())
        throw new ForbiddenException('codeExpired');

      await prisma.user.update({
        where: { email },
        data: {
          otpValidated: true,
        },
      });

      return { message: 'codeValidated' };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      console.error('Verify reset code failed:', error);
      throw new InternalServerErrorException('serverError');
    }
  }

  async resetPassword(email: string, newPassword: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.otpValidated)
        throw new ForbiddenException('invalidCode');

      const hashed = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { email },
        data: {
          password: hashed,
          resetCode: null,
          resetCodeExpiry: null,
          otpValidated: false,
        },
      });

      return { message: 'passwordResetSuccessfully' };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;

      console.error('Reset password failed:', error);
      throw new InternalServerErrorException('serverError');
    }
  }

  async validateOAuthLogin(user: { email: string; name: string; provider: string }) {
    let existingUser = await prisma.user.findUnique({ where: { email: user.email } });

    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password: "",
          role: "customer",
          provider: user.provider,
        },
      });
    }

    return this.signTokens(existingUser.id, existingUser.email);
  }
}
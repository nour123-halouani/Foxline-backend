import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthDto } from './dtos/auth.dto';
import { randomBytes } from 'crypto';
import { transporter } from '../utils/nodemailer';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  async signup(dto: AuthDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new ForbiddenException('Email already used');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        phone: dto.phone,
        role: dto.role,
      },
    });

    return this.signTokens(user.id, user.email);
  }

  async signin(dto: AuthDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new ForbiddenException('User not found');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new ForbiddenException('Invalid credentials');

    return this.signTokens(user.id, user.email);
  }

  async signTokens(userId: number, email: string) {
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
  }

  async refreshTokens(userId: number, refreshToken: string) {
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
  }

  async logout(userId: number) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async sendResetCode(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ForbiddenException('User not found');

    const code = randomBytes(3).toString('hex');
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

    return { message: 'Reset code sent to your email' };
  }

  async verifyResetCode(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetCode || !user.resetCodeExpiry)
      throw new ForbiddenException('Invalid request');

    if (user.resetCode !== code)
      throw new ForbiddenException('Invalid reset code');

    if (user.resetCodeExpiry < new Date())
      throw new ForbiddenException('Reset code expired');

    await prisma.user.update({
      where: { email },
      data: {
        otpValidated: true,
      },
    });

    return { message: 'Code validated successfully' };
  }

  async resetPassword(email: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.otpValidated)
      throw new ForbiddenException('Reset code not validated');

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

    return { message: 'Password has been reset successfully' };
  }

  async validateOAuthLogin(user: { email: string; name: string; provider: string, password: string }) {
    let existingUser = await prisma.user.findUnique({ where: { email: user.email } });

    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password: user.password,
          role: 'USER',
        },
      });
    }

    return this.signTokens(existingUser.id, existingUser.email);
  }

}
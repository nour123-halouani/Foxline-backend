import { Body, Controller, Post, Req, Res, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from 'src/common/guards/jwt-refresh.guard';
import { AuthDto } from './dtos/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refreshTokens(@Req() req: any) {
    const user = req.user as any;
    return this.authService.refreshTokens(user.id, user.refreshToken);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  logout(@Req() req: any) {
    const user = req.user as any;
    return this.authService.logout(user.id);
  }

  @Post('reset-password/send-code')
  async sendResetCode(@Body('email') email: string) {
    return this.authService.sendResetCode(email);
  }

  @Post('reset-password/validate-code')
  async validateResetCode(
    @Body('email') email: string,
    @Body('code') code: string,
  ) {
    return this.authService.verifyResetCode(email, code);
  }

  @Post('reset-password/confirm')
  async resetPassword(
    @Body('email') email: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(email, newPassword);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() { }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const user = req.user;
    const tokens = await this.authService.validateOAuthLogin(user);
    return res.redirect(`http://localhost:3000/auth-success?token=${tokens.accessToken}`);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookAuth() { }

  @Get('facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(@Req() req, @Res() res: Response) {
    const user = req.user;
    const tokens = await this.authService.validateOAuthLogin(user);
    return res.redirect(`http://localhost:3000/auth-success?token=${tokens.accessToken}`);
  }
}

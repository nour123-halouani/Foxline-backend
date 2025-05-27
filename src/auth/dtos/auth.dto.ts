import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
  name: string;
  phone: string;
  role: string;
  provider: string;
  isCompany: Boolean;
}

export class SendResetCodeDto {
  email: string;
}

export class VerifyResetCodeDto {
  email: string;
  code: number;
  newPassword: string;
}


import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SendCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class LoginWithCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

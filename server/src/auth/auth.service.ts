import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, ResetPasswordDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../user/schema/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<any> {
    const user = await this.userService.findByUsername(loginDto.username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('User is blocked');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      userId: user._id.toString(),
      tenantId: user.tenantCode.toString(),
      role: user.role,
    };
  }

  async generateAndSendVerificationCode(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User with this email not found');
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('User is blocked');
    }

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.userService.saveVerificationCode(user._id.toString(), code, expiresAt);

    // Send the real email
    try {
      await this.mailService.sendVerificationCode(email, code);
    } catch (error) {
      // Clear the code if email fails
      await this.userService.clearVerificationCode(user._id.toString());
      throw new Error('Could not send verification email. Please try again.');
    }
  }

  async validateCodeAndLogin(email: string, code: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or code');
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('User is blocked');
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
      throw new UnauthorizedException('Verification code expired');
    }

    // clear code
    await this.userService.clearVerificationCode(user._id.toString());

    return {
      userId: user._id.toString(),
      tenantId: user.tenantCode.toString(),
      role: user.role,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or code');
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('User is blocked');
    }

    if (!user.verificationCode || user.verificationCode !== dto.code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
      throw new UnauthorizedException('Verification code expired');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.userService.updatePassword(user._id.toString(), passwordHash);
    await this.userService.clearVerificationCode(user._id.toString());
  }

  async login(user: any) {
    const payload = {
      userId: user.userId,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(user: any) {
    const payload = {
      userId: user.userId,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    return {
      accessToken,
    };
  }
}

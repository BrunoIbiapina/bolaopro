import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import * as bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const emailVerificationToken = nanoid(32);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        fullName: registerDto.fullName,
        password: hashedPassword,
        emailVerificationToken,
        emailVerifiedAt: null,
        ...(registerDto.pixKey ? { pixKey: registerDto.pixKey } : {}),
      },
    });

    // Auto-login after register
    const payload: JwtPayload = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const refreshTokenData = nanoid(32);
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(
      refreshTokenExpiresAt.getDate() +
        parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || '7'),
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenData,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenData,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Esta conta usa login com Google. Use o botão "Continuar com Google".');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const refreshTokenData = nanoid(32);
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(
      refreshTokenExpiresAt.getDate() +
        parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || '7'),
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenData,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenData,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: { user: true },
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const payload: JwtPayload = {
      id: refreshToken.user.id,
      sub: refreshToken.user.id,
      email: refreshToken.user.email,
      role: refreshToken.user.role,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const newRefreshTokenData = nanoid(32);
    const newRefreshTokenExpiresAt = new Date();
    newRefreshTokenExpiresAt.setDate(
      newRefreshTokenExpiresAt.getDate() +
        parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || '7'),
    );

    await this.prisma.refreshToken.delete({
      where: { id: refreshToken.id },
    });

    const newRefreshToken = await this.prisma.refreshToken.create({
      data: {
        token: newRefreshTokenData,
        userId: refreshToken.user.id,
        expiresAt: newRefreshTokenExpiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out successfully' };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: verifyEmailDto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      message: 'Email verified successfully',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      return { message: 'If user exists, password reset email sent' };
    }

    const resetToken = nanoid(32);
    const resetTokenExpiresAt = new Date();
    resetTokenExpiresAt.setHours(resetTokenExpiresAt.getHours() + 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpiresAt: resetTokenExpiresAt,
      },
    });

    return { message: 'If user exists, password reset email sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: resetPasswordDto.token,
        passwordResetTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }) {
    // 1. Tenta achar pelo googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (user) return user;

    // 2. Tenta achar pelo email (conta existente sem Google)
    user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (user) {
      // Vincula a conta Google à conta existente
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          ...(profile.avatar && !user.avatar ? { avatar: profile.avatar } : {}),
        },
      });
      return user;
    }

    // 3. Cria usuário novo via Google (sem senha)
    user = await this.prisma.user.create({
      data: {
        googleId: profile.googleId,
        email: profile.email,
        fullName: profile.fullName,
        avatar: profile.avatar ?? null,
        password: null,
        emailVerifiedAt: new Date(), // Google já verificou o email
      },
    });

    return user;
  }

  async googleLogin(user: any) {
    const payload: JwtPayload = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const refreshTokenData = nanoid(32);
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(
      refreshTokenExpiresAt.getDate() +
        parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || '7'),
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenData,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenData };
  }
}

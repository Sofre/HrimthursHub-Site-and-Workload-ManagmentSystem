import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';

export interface LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: number; // employee_id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // Find user WITH password for authentication
    const user = await this.prisma.employees.findUnique({
      where: { email: loginDto.email },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new HttpErrorByCode[401]('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new HttpErrorByCode[401]('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new HttpErrorByCode[403]('Account is deactivated');
    }
      // handle error handling 
  

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.employee_id,
      email: user.email,
      role: user.roles?.role_name || 'employee',
    };

    return {
      access_token: this.jwtService.sign(payload),
      force_password_change: user.force_password_change || false,
      user: {
        employee_id: user.employee_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.roles?.role_name || 'employee',
      },
    };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.employees.findUnique({
      where: { employee_id: payload.sub },
      include: {
        roles: true,
      },
    });

    if (!user || user.status !== 'active') {
      return null;
    }

    return {
      employee_id: user.employee_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.roles?.role_name || 'employee',
    };
  }

  async changePassword(employeeId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.employees.findUnique({
      where: { employee_id: employeeId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear force_password_change flag
    await this.prisma.employees.update({
      where: { employee_id: employeeId },
      data: { 
        password: hashedNewPassword,
        force_password_change: false
      },
    });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.employees.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, you will receive a reset link' };
    }

    // In production, generate reset token and send email
    // For now, just return success
    return { message: 'If the email exists, you will receive a reset link' };
  }

  async refreshToken(oldToken: string) {
    try {
      const payload = this.jwtService.verify(oldToken);
      const user = await this.validateUser(payload);
      
      if (!user) {
        throw new Error('Invalid token');
      }

      const newPayload: JwtPayload = {
        sub: user.employee_id,
        email: user.email,
        role: user.role,
      };

      return {
        access_token: this.jwtService.sign(newPayload),
        user,
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
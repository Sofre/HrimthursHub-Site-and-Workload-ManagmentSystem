import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginDto } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { Public } from './decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('test')
  @HttpCode(HttpStatus.OK)
  testEndpoint() {
    return {
      message: 'Auth service is working!',
      timestamp: new Date().toISOString(),
      server: 'Site Management Backend',
      version: '1.0.0'
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    return this.authService.changePassword(
      req.user.employee_id,
      body.currentPassword,
      body.newPassword
    );
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() body: { token: string }) {
    return this.authService.refreshToken(body.token);
  }
}
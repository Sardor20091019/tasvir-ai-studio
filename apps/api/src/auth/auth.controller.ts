import { Controller, Post, Get, Body, Headers, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOtp(
    @Body()
    body: {
      phoneNumber: string;
      turnstileToken?: string;
    },
  ) {
    return this.authService.sendOtp(body.phoneNumber, body.turnstileToken);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { phoneNumber: string; code: string }) {
    return this.authService.verifyOtp(body.phoneNumber, body.code);
  }

  @Post('google')
  async googleLogin(
    @Body()
    body: {
      credential?: string;
      email?: string;
      name?: string;
      googleId?: string;
      avatarUrl?: string;
    },
  ) {
    return this.authService.googleLogin(body);
  }

  @Post('telegram-webapp')
  async telegramWebapp(
    @Body()
    body: {
      telegramId: number;
      firstName: string;
      lastName?: string;
      username?: string;
    },
  ) {
    return this.authService.validateTelegramWebapp(body);
  }

  @Get('me')
  async getMe(@Headers('x-user-id') userId?: string) {
    return this.authService.getCurrentUser(userId);
  }
}

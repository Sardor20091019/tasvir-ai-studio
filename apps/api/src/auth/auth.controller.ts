import { Controller, Post, Get, Body, Headers, Inject, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtUtil } from './jwt.util';

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
    },
  ) {
    return this.authService.googleLogin(body);
  }

  @Get('me')
  async getMe(
    @Headers('authorization') authHeader?: string,
    @Headers('x-user-id') fallbackUserId?: string,
  ) {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = JwtUtil.verify(authHeader.slice(7).trim());
      return this.authService.getCurrentUser(payload.sub);
    }

    // Only permit explicit fallback user in non-production development environments if specifically passed
    if (process.env.NODE_ENV === 'development' && fallbackUserId) {
      return this.authService.getCurrentUser(fallbackUserId);
    }

    throw new UnauthorizedException('Iltimos, avval tizimga kiring (Avtorizatsiya talab qilinadi)');
  }
}

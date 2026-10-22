import { Controller, Post, Get, Body, Headers, Inject } from '@nestjs/common';
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
      email?: string;
      name?: string;
      googleId?: string;
      avatarUrl?: string;
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
      try {
        const payload = JwtUtil.verify(authHeader.slice(7).trim());
        return this.authService.getCurrentUser(payload.sub);
      } catch (e) {}
    }
    // Only permit unauthenticated fallback in non-production environments
    const allowedFallback = process.env.NODE_ENV !== 'production' ? fallbackUserId : undefined;
    return this.authService.getCurrentUser(allowedFallback);
  }
}

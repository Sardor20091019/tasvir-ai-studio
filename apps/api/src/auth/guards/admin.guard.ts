import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtUtil } from '../jwt.util';
import { KyselyService } from '../../database/kysely.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(KyselyService) private readonly db: KyselyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminKeyHeader = request.headers['x-admin-key'];
    const configuredAdminKey = process.env.ADMIN_SECRET_KEY;

    // 1. Direct secure API Key authentication for Admin operations
    if (adminKeyHeader && configuredAdminKey) {
      const headerBuf = Buffer.from(String(adminKeyHeader));
      const keyBuf = Buffer.from(String(configuredAdminKey));
      if (headerBuf.length === keyBuf.length && crypto.timingSafeEqual(headerBuf, keyBuf)) {
        return true;
      }
    }

    // 2. JWT-based Role Verification
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In non-production, check x-user-id header
      if (process.env.NODE_ENV !== 'production' && request.headers['x-user-id']) {
        const fallbackUserId = request.headers['x-user-id'];
        const user = await this.db
          .selectFrom('users')
          .selectAll()
          .where('id', '=', fallbackUserId)
          .executeTakeFirst();
        if (user && user.role === 'admin') {
          request.user = user;
          return true;
        }
      }
      throw new UnauthorizedException('Admin avtorizatsiyasi talab qilinadi');
    }

    const token = authHeader.slice(7).trim();
    const payload = JwtUtil.verify(token);

    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', payload.sub)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi hisobi topilmadi');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('Kirish taqiqlangan: Faqat platforma administratori token ajrata oladi');
    }

    request.user = user;
    return true;
  }
}

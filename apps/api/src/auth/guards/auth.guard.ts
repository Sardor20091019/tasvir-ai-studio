import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtUtil } from '../jwt.util';
import { KyselyService } from '../../database/kysely.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(KyselyService) private readonly db: KyselyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In development, if a valid demo user header is passed, allow fallback for smooth local testing
      if (process.env.NODE_ENV !== 'production' && request.headers['x-user-id']) {
        const fallbackUserId = request.headers['x-user-id'];
        const user = await this.db
          .selectFrom('users')
          .selectAll()
          .where('id', '=', fallbackUserId)
          .executeTakeFirst();
        if (user) {
          request.user = user;
          return true;
        }
      }
      throw new UnauthorizedException('Iltimos, avval tizimga kiring (Avtorizatsiya talab qilinadi)');
    }

    const token = authHeader.slice(7).trim();
    const payload = JwtUtil.verify(token);

    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', payload.sub)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi hisobi topilmadi yoki oʻchirilgan');
    }

    request.user = user;
    return true;
  }
}

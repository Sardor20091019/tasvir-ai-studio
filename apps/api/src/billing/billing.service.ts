import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { KyselyService } from '../database/kysely.service';
import { sql } from 'kysely';
import { PaymentTransaction, TokenRequest } from '../database/schema';

export interface PlanConfig {
  id: string;
  nameUz: string;
  credits: number;
  description: string;
  badge?: string;
  features: string[];
}

export const TOKEN_PLANS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    nameUz: 'Boshlangʻich Tokenlar',
    credits: 10,
    description: 'Yangi boshlagan Uzum va Telegram sotuvchilari uchun',
    features: ['10 ta HD video', 'Barcha 4 ta AI boshlovchi', '9:16 formati', 'Subtitrlar bilan'],
  },
  shop_pro: {
    id: 'shop_pro',
    nameUz: 'Doʻkon Pro Tokenlar',
    credits: 35,
    badge: 'Eng ommabop',
    description: 'Faol savdo qiluvchi doʻkonlar va brendlar uchun',
    features: [
      '35 ta Full HD video',
      'Tezkor render navbati',
      'Maxsus logotip va fonlar',
      'Ovoz tonlarini moslash',
      'Telegram bot integratsiyasi',
    ],
  },
  agency: {
    id: 'agency',
    nameUz: 'Agentlik / Top Seller',
    credits: 100,
    description: 'Katta doʻkonlar va marketing agentliklari uchun',
    features: [
      '100 ta 4K video',
      'Eng yuqori server ustuvorligi',
      'Eksklyuziv klonlangan ovozlar',
      'API kalitlar va cheksiz yuklash',
      '24/7 shaxsiy menejer',
    ],
  },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(@Inject(KyselyService) private readonly db: KyselyService) {}

  getPlans(): PlanConfig[] {
    return Object.values(TOKEN_PLANS);
  }

  // 1. User submits a request for tokens to the admin
  async requestTokens(params: {
    userId: string;
    requestedTokens: number;
    note?: string;
  }): Promise<{ success: boolean; message: string; requestId: string }> {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', params.userId)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('Foydalanuvchi hisobi topilmadi');
    }

    const tokens = Math.max(1, Math.min(Math.floor(Number(params.requestedTokens) || 10), 1000));
    const safeNote = (params.note || '').slice(0, 500).trim();

    const request = await this.db
      .insertInto('token_requests')
      .values({
        user_id: user.id,
        phone_number: user.phone_number,
        requested_tokens: tokens,
        note: safeNote || null,
        status: 'pending',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    this.logger.log(`User ${user.phone_number} requested ${tokens} tokens (Req ID: ${request.id})`);

    return {
      success: true,
      message: 'Soʻrovingiz adminga muvaffaqiyatli yuborildi. Administrator tez orada hisobingizga tokenlarni taqdim etadi.',
      requestId: request.id,
    };
  }

  // 2. User views their own token request history
  async getUserRequests(userId: string): Promise<TokenRequest[]> {
    return await this.db
      .selectFrom('token_requests')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  // 3. User views past token grants / transactions
  async listUserTransactions(userId: string): Promise<PaymentTransaction[]> {
    return await this.db
      .selectFrom('payment_transactions')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  // 4. ADMIN ONLY: Grant tokens directly to user with atomic transaction
  async grantTokensByAdmin(params: {
    adminId?: string;
    targetUserId?: string;
    targetPhoneNumber?: string;
    tokensToAdd: number;
    reason?: string;
    requestId?: string;
  }): Promise<{ success: boolean; message: string; newBalance: number; user: any }> {
    const tokens = Math.floor(Number(params.tokensToAdd) || 0);
    if (tokens <= 0 || tokens > 100000) {
      throw new BadRequestException('Ajratilayotgan tokenlar soni 1 dan 100,000 gacha boʻlishi kerak');
    }

    return await this.db.transaction().execute(async (trx) => {
      let targetUserQuery = trx.selectFrom('users').selectAll();

      if (params.targetUserId) {
        targetUserQuery = targetUserQuery.where('id', '=', params.targetUserId);
      } else if (params.targetPhoneNumber) {
        let cleanPhone = params.targetPhoneNumber.replace(/[^\d+]/g, '');
        if (!cleanPhone.startsWith('+998') && cleanPhone.length === 9) {
          cleanPhone = '+998' + cleanPhone;
        }
        targetUserQuery = targetUserQuery.where('phone_number', '=', cleanPhone);
      } else {
        throw new BadRequestException('Foydalanuvchi ID yoki telefon raqami kiritilishi shart');
      }

      const targetUser = await targetUserQuery.forUpdate().executeTakeFirst();
      if (!targetUser) {
        throw new NotFoundException('Token berilishi kerak boʻlgan foydalanuvchi topilmadi');
      }

      // Add tokens atomically
      const updatedUser = await trx
        .updateTable('users')
        .set({
          credits_balance: sql`credits_balance + ${tokens}`,
          updated_at: sql`now()`,
        })
        .where('id', '=', targetUser.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // If an existing token request was fulfilled, mark it approved
      if (params.requestId) {
        await trx
          .updateTable('token_requests')
          .set({
            status: 'approved',
            admin_id: params.adminId || null,
            resolved_at: sql`now()`,
          })
          .where('id', '=', params.requestId)
          .execute();
      }

      // Record immutable audit transaction
      await trx
        .insertInto('payment_transactions')
        .values({
          user_id: targetUser.id,
          provider: 'admin_grant',
          plan_tier: targetUser.plan_tier,
          amount_uzs: 0,
          credits_added: tokens,
          phone_number: targetUser.phone_number,
          external_tx_id: `admin_${params.adminId || 'key'}_${Date.now()}`,
          status: 'completed',
        })
        .execute();

      this.logger.log(
        `[ADMIN AUDIT] Granted ${tokens} tokens to user ${targetUser.id} (${targetUser.phone_number}) by admin ${params.adminId || 'API_KEY'}. Reason: ${params.reason || 'None'}`
      );

      return {
        success: true,
        message: `${targetUser.full_name} (${targetUser.phone_number}) ga ${tokens} ta token muvaffaqiyatli taqdim etildi. Yangi balans: ${updatedUser.credits_balance}`,
        newBalance: updatedUser.credits_balance,
        user: updatedUser,
      };
    });
  }

  // 5. ADMIN ONLY: List pending token requests
  async listPendingRequests(): Promise<any[]> {
    return await this.db
      .selectFrom('token_requests')
      .innerJoin('users', 'users.id', 'token_requests.user_id')
      .select([
        'token_requests.id as requestId',
        'token_requests.requested_tokens as requestedTokens',
        'token_requests.note as note',
        'token_requests.status as status',
        'token_requests.created_at as createdAt',
        'token_requests.resolved_at as resolvedAt',
        'users.id as userId',
        'users.full_name as userName',
        'users.phone_number as userPhone',
        'users.credits_balance as currentBalance',
      ])
      .orderBy('token_requests.created_at', 'desc')
      .execute();
  }

  // 6. ADMIN ONLY: Reject token request
  async rejectRequest(requestId: string, adminId?: string): Promise<{ success: boolean; message: string }> {
    await this.db
      .updateTable('token_requests')
      .set({
        status: 'rejected',
        admin_id: adminId || null,
        resolved_at: sql`now()`,
      })
      .where('id', '=', requestId)
      .execute();

    return {
      success: true,
      message: 'Soʻrov rad etildi',
    };
  }

  // 7. ADMIN ONLY: List all users to grant tokens
  async listUsersForAdmin(): Promise<any[]> {
    return await this.db
      .selectFrom('users')
      .select(['id', 'full_name', 'phone_number', 'role', 'plan_tier', 'credits_balance', 'created_at'])
      .orderBy('created_at', 'desc')
      .limit(100)
      .execute();
  }
}

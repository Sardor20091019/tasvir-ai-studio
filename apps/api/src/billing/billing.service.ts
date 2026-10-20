import { Injectable, BadRequestException, NotFoundException, Logger, Inject } from '@nestjs/common';
import { KyselyService } from '../database/kysely.service';
import { sql } from 'kysely';
import { PaymentTransaction } from '../database/schema';

export interface PlanConfig {
  id: string;
  nameUz: string;
  priceUzs: number;
  credits: number;
  description: string;
  badge?: string;
  features: string[];
}

export const BILLING_PLANS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    nameUz: 'Boshlangʻich',
    priceUzs: 99000,
    credits: 10,
    description: 'Yangi boshlagan Uzum va Telegram sotuvchilari uchun',
    features: ['10 ta HD video', 'Barcha 4 ta AI boshlovchi', '9:16 formati', 'Subtitrlar bilan'],
  },
  shop_pro: {
    id: 'shop_pro',
    nameUz: 'Doʻkon Pro',
    priceUzs: 249000,
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
    priceUzs: 590000,
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
    return Object.values(BILLING_PLANS);
  }

  async createCheckoutSession(params: {
    userId: string;
    planTier: string;
    provider: 'payme' | 'click' | 'uzum';
    phoneNumber: string;
  }): Promise<{
    transactionId: string;
    checkoutUrl: string;
    amountUzs: number;
    creditsAdded: number;
    provider: string;
  }> {
    const plan = BILLING_PLANS[params.planTier];
    if (!plan) {
      throw new BadRequestException(`Notoʻgʻri tarif rejasi: ${params.planTier}`);
    }

    const tx = await this.db
      .insertInto('payment_transactions')
      .values({
        user_id: params.userId,
        provider: params.provider,
        plan_tier: params.planTier,
        amount_uzs: plan.priceUzs,
        credits_added: plan.credits,
        phone_number: params.phoneNumber,
        status: 'pending',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Generate provider-specific deep link / checkout URL
    let checkoutUrl = '';
    const encodedParams = Buffer.from(`m=tasvir;ac.order_id=${tx.id};a=${plan.priceUzs * 100}`).toString('base64');

    if (params.provider === 'payme') {
      checkoutUrl = `https://checkout.paycom.uz/${encodedParams}`;
    } else if (params.provider === 'click') {
      checkoutUrl = `https://my.click.uz/services/pay?service_id=tasvir_ai&merchant_id=9821&amount=${plan.priceUzs}&transaction_param=${tx.id}`;
    } else {
      checkoutUrl = `https://www.bankuzum.uz/pay?orderId=${tx.id}&amount=${plan.priceUzs}`;
    }

    return {
      transactionId: tx.id,
      checkoutUrl,
      amountUzs: plan.priceUzs,
      creditsAdded: plan.credits,
      provider: params.provider,
    };
  }

  async confirmPayment(transactionId: string): Promise<{ success: boolean; newCreditsBalance: number; planTier: string }> {
    return await this.db.transaction().execute(async (trx) => {
      const tx = await trx
        .selectFrom('payment_transactions')
        .selectAll()
        .where('id', '=', transactionId)
        .forUpdate()
        .executeTakeFirst();

      if (!tx) {
        throw new NotFoundException('Toʻlov tranzaksiyasi topilmadi');
      }

      if (tx.status === 'paid') {
        const user = await trx
          .selectFrom('users')
          .select(['credits_balance', 'plan_tier'])
          .where('id', '=', tx.user_id)
          .executeTakeFirstOrThrow();
        return { success: true, newCreditsBalance: user.credits_balance, planTier: user.plan_tier };
      }

      // Mark paid
      await trx
        .updateTable('payment_transactions')
        .set({ status: 'paid' })
        .where('id', '=', transactionId)
        .execute();

      // Atomically add credits and update plan tier
      const updatedUser = await trx
        .updateTable('users')
        .set({
          credits_balance: sql`credits_balance + ${tx.credits_added}`,
          plan_tier: tx.plan_tier,
          updated_at: sql`now()`,
        })
        .where('id', '=', tx.user_id)
        .returning(['credits_balance', 'plan_tier'])
        .executeTakeFirstOrThrow();

      this.logger.log(`Confirmed payment ${transactionId}: Added ${tx.credits_added} credits to user ${tx.user_id}`);

      return {
        success: true,
        newCreditsBalance: updatedUser.credits_balance,
        planTier: updatedUser.plan_tier,
      };
    });
  }

  async listUserTransactions(userId?: string): Promise<PaymentTransaction[]> {
    if (userId) {
      return await this.db
        .selectFrom('payment_transactions')
        .selectAll()
        .where('user_id', '=', userId)
        .orderBy('created_at', 'desc')
        .execute();
    }

    return await this.db
      .selectFrom('payment_transactions')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(20)
      .execute();
  }

  // Payme Webhook Handler
  async handlePaymeWebhook(body: any) {
    this.logger.log(`Payme webhook event received: ${JSON.stringify(body)}`);
    const { method, params, id } = body || {};

    if (method === 'CheckPerformTransaction') {
      return { result: { allow: true }, id };
    }

    if (method === 'PerformTransaction') {
      const orderId = params?.account?.order_id;
      if (orderId) {
        await this.confirmPayment(orderId);
      }
      return {
        result: {
          transaction: params?.id || 'payme_tx_mock',
          perform_time: Date.now(),
          state: 2,
        },
        id,
      };
    }

    return { result: { state: 2 }, id };
  }

  // Click Webhook Handler
  async handleClickWebhook(body: any) {
    this.logger.log(`Click webhook event received: ${JSON.stringify(body)}`);
    const { action, merchant_trans_id, click_trans_id } = body || {};

    if (action === 1 && merchant_trans_id) {
      await this.confirmPayment(merchant_trans_id);
    }

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: Date.now(),
      error: 0,
      error_note: 'Success',
    };
  }

  // Uzum Webhook Handler
  async handleUzumWebhook(body: any) {
    this.logger.log(`Uzum webhook event received: ${JSON.stringify(body)}`);
    const { orderId, status } = body || {};
    if (status === 'SUCCESS' && orderId) {
      await this.confirmPayment(orderId);
    }
    return { status: 'OK', orderId };
  }
}

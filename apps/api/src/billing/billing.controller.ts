import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  HttpCode,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Post('checkout')
  @UseGuards(AuthGuard)
  async createCheckout(
    @CurrentUser('id') currentUserId: string,
    @Body()
    body: {
      userId?: string;
      planTier: string;
      provider: 'payme' | 'click' | 'uzum';
      phoneNumber: string;
    },
  ) {
    // Prevent IDOR: always use authenticated user's ID
    return this.billingService.createCheckoutSession({
      userId: currentUserId,
      planTier: body.planTier,
      provider: body.provider,
      phoneNumber: body.phoneNumber,
    });
  }

  @Post('confirm-test-payment')
  @UseGuards(AuthGuard)
  async confirmTestPayment(
    @CurrentUser('id') currentUserId: string,
    @Body()
    body: {
      transactionId: string;
    },
  ) {
    // Only enabled in non-production, and checked against the calling user's own transaction
    return this.billingService.confirmTestPayment(body.transactionId, currentUserId);
  }

  @Get('transactions')
  @UseGuards(AuthGuard)
  async listTransactions(@CurrentUser('id') currentUserId: string) {
    // Strictly isolate transactions to authenticated user
    return this.billingService.listUserTransactions(currentUserId);
  }

  // Webhooks
  @Post('webhook/payme')
  @HttpCode(200)
  async paymeWebhook(
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.billingService.handlePaymeWebhook(body, authHeader);
  }

  @Post('webhook/click')
  @HttpCode(200)
  async clickWebhook(@Body() body: any) {
    return this.billingService.handleClickWebhook(body);
  }

  @Post('webhook/uzum')
  @HttpCode(200)
  async uzumWebhook(
    @Body() body: any,
    @Headers('x-uzum-token') uzumToken?: string,
  ) {
    return this.billingService.handleUzumWebhook(body, uzumToken);
  }
}

import { Controller, Get, Post, Body, Headers, HttpCode, Inject } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Post('checkout')
  async createCheckout(
    @Body()
    body: {
      userId: string;
      planTier: string;
      provider: 'payme' | 'click' | 'uzum';
      phoneNumber: string;
    },
  ) {
    return this.billingService.createCheckoutSession(body);
  }

  @Post('confirm-test-payment')
  async confirmTestPayment(
    @Body()
    body: {
      transactionId: string;
    },
  ) {
    return this.billingService.confirmPayment(body.transactionId);
  }

  @Get('transactions')
  async listTransactions(
    @Headers('x-user-id') headerUserId?: string,
  ) {
    return this.billingService.listUserTransactions(headerUserId);
  }

  // Webhooks
  @Post('webhook/payme')
  @HttpCode(200)
  async paymeWebhook(@Body() body: any) {
    return this.billingService.handlePaymeWebhook(body);
  }

  @Post('webhook/click')
  @HttpCode(200)
  async clickWebhook(@Body() body: any) {
    return this.billingService.handleClickWebhook(body);
  }

  @Post('webhook/uzum')
  @HttpCode(200)
  async uzumWebhook(@Body() body: any) {
    return this.billingService.handleUzumWebhook(body);
  }
}

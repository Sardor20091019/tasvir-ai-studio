import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Post('request-tokens')
  @UseGuards(AuthGuard)
  async requestTokens(
    @CurrentUser('id') currentUserId: string,
    @Body()
    body: {
      requestedTokens: number;
      note?: string;
    },
  ) {
    return this.billingService.requestTokens({
      userId: currentUserId,
      requestedTokens: body.requestedTokens,
      note: body.note,
    });
  }

  @Get('my-requests')
  @UseGuards(AuthGuard)
  async getMyRequests(@CurrentUser('id') currentUserId: string) {
    return this.billingService.getUserRequests(currentUserId);
  }

  @Get('transactions')
  @UseGuards(AuthGuard)
  async listTransactions(@CurrentUser('id') currentUserId: string) {
    return this.billingService.listUserTransactions(currentUserId);
  }
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Post('grant-tokens')
  async grantTokens(
    @CurrentUser('id') adminId: string,
    @Body()
    body: {
      targetUserId?: string;
      targetEmail?: string;
      targetPhoneNumber?: string;
      tokensToAdd: number;
      reason?: string;
      requestId?: string;
    },
  ) {
    return this.billingService.grantTokensByAdmin({
      adminId,
      targetUserId: body.targetUserId,
      targetEmail: body.targetEmail,
      targetPhoneNumber: body.targetPhoneNumber,
      tokensToAdd: body.tokensToAdd,
      reason: body.reason,
      requestId: body.requestId,
    });
  }

  @Get('requests')
  async listRequests() {
    return this.billingService.listPendingRequests();
  }

  @Post('reject-request')
  async rejectRequest(
    @CurrentUser('id') adminId: string,
    @Body() body: { requestId: string },
  ) {
    return this.billingService.rejectRequest(body.requestId, adminId);
  }

  @Get('users')
  async listUsers() {
    return this.billingService.listUsersForAdmin();
  }
}

import { Module } from '@nestjs/common';
import { BillingController, AdminController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  controllers: [BillingController, AdminController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

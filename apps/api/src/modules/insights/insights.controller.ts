import { Controller, Get } from '@nestjs/common';
import { InsightsService } from './insights.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserProfile } from '@subguard/types';

@Controller('api/v1/insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: UserProfile) {
    return this.insightsService.getSummary(user.id);
  }

  @Get('categories')
  async getCategories(@CurrentUser() user: UserProfile) {
    return this.insightsService.getCategoryBreakdown(user.id);
  }

  @Get('reconciliation')
  async getReconciliation(@CurrentUser() user: UserProfile) {
    return this.insightsService.getReconciliation(user.id);
  }
}

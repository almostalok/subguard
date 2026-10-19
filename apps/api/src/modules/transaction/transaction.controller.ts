import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserProfile, TransactionDirection } from '@subguard/types';

@Controller('api/v1/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async list(
    @CurrentUser() user: UserProfile,
    @Query('direction') direction?: TransactionDirection,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('importId') importId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.transactionService.list(user.id, {
      direction,
      search,
      startDate,
      endDate,
      importId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch(':id/exclude')
  async toggleExclude(
    @CurrentUser() user: UserProfile,
    @Param('id') id: string
  ) {
    return this.transactionService.toggleExclude(user.id, id);
  }
}

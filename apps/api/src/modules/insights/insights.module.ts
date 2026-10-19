import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service.js';
import { InsightsController } from './insights.controller.js';

@Module({
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}

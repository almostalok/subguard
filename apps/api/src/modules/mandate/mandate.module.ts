import { Module } from '@nestjs/common';
import { MandateService } from './mandate.service.js';
import { MandateController } from './mandate.controller.js';

@Module({
  controllers: [MandateController],
  providers: [MandateService],
  exports: [MandateService],
})
export class MandateModule {}

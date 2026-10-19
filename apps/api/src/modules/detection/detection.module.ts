import { Module } from '@nestjs/common';
import { DetectionService } from './detection.service.js';
import { DetectionController } from './detection.controller.js';

@Module({
  controllers: [DetectionController],
  providers: [DetectionService],
  exports: [DetectionService],
})
export class DetectionModule {}

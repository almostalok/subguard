import { Module } from '@nestjs/common';
import { CommitmentService } from './commitment.service.js';
import { CommitmentController } from './commitment.controller.js';

@Module({
  controllers: [CommitmentController],
  providers: [CommitmentService],
  exports: [CommitmentService],
})
export class CommitmentModule {}

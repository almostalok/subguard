import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UsePipes,
} from '@nestjs/common';
import { DetectionService } from './detection.service.js';
import {
  confirmCandidateSchema,
  ConfirmCandidateInput,
} from '@subguard/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserProfile } from '@subguard/types';

@Controller('api/v1/detection')
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  @Post('run')
  async run(@CurrentUser() user: UserProfile) {
    return this.detectionService.runDetection(user.id);
  }

  @Get('candidates')
  async listCandidates(@CurrentUser() user: UserProfile) {
    return this.detectionService.listCandidates(user.id);
  }

  @Post('candidates/:id/confirm')
  @UsePipes(new ZodValidationPipe(confirmCandidateSchema))
  async confirm(
    @CurrentUser() user: UserProfile,
    @Param('id') id: string,
    @Body() body: ConfirmCandidateInput
  ) {
    return this.detectionService.confirmCandidate(user.id, id, body);
  }

  @Post('candidates/:id/dismiss')
  async dismiss(
    @CurrentUser() user: UserProfile,
    @Param('id') id: string
  ) {
    return this.detectionService.dismissCandidate(user.id, id);
  }
}

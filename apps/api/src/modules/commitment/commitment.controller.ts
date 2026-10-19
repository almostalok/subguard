import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
} from '@nestjs/common';
import { CommitmentService } from './commitment.service.js';
import {
  createCommitmentSchema,
  updateCommitmentSchema,
  CreateCommitmentInput,
  UpdateCommitmentInput,
} from '@subguard/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  UserProfile,
  CommitmentStatus,
  CommitmentCategory,
} from '@subguard/types';

@Controller('api/v1/commitments')
export class CommitmentController {
  constructor(private readonly commitmentService: CommitmentService) {}

  @Get()
  async list(
    @CurrentUser() user: UserProfile,
    @Query('status') status?: CommitmentStatus,
    @Query('category') category?: CommitmentCategory,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.commitmentService.list(user.id, {
      status,
      category,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createCommitmentSchema))
  async create(
    @CurrentUser() user: UserProfile,
    @Body() body: CreateCommitmentInput
  ) {
    return this.commitmentService.create(user.id, body);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: UserProfile, @Param('id') id: string) {
    return this.commitmentService.findOne(user.id, id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateCommitmentSchema))
  async update(
    @CurrentUser() user: UserProfile,
    @Param('id') id: string,
    @Body() body: UpdateCommitmentInput
  ) {
    return this.commitmentService.update(user.id, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserProfile, @Param('id') id: string) {
    return this.commitmentService.delete(user.id, id);
  }
}

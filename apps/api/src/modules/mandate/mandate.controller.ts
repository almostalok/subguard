import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UsePipes,
} from '@nestjs/common';
import { MandateService } from './mandate.service.js';
import {
  createMandateSchema,
  updateMandateSchema,
  CreateMandateInput,
  UpdateMandateInput,
} from '@subguard/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserProfile } from '@subguard/types';

@Controller('api/v1/mandates')
export class MandateController {
  constructor(private readonly mandateService: MandateService) {}

  @Get()
  async list(@CurrentUser() user: UserProfile) {
    return this.mandateService.list(user.id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createMandateSchema))
  async create(
    @CurrentUser() user: UserProfile,
    @Body() body: CreateMandateInput
  ) {
    return this.mandateService.create(user.id, body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateMandateSchema))
  async update(
    @CurrentUser() user: UserProfile,
    @Param('id') id: string,
    @Body() body: UpdateMandateInput
  ) {
    return this.mandateService.update(user.id, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserProfile, @Param('id') id: string) {
    return this.mandateService.delete(user.id, id);
  }
}

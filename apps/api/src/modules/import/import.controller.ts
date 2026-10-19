import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UsePipes,
} from '@nestjs/common';
import { ImportService } from './import.service.js';
import {
  commitImportSchema,
  CommitImportInput,
} from '@subguard/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserProfile } from '@subguard/types';

@Controller('api/v1/imports')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('preview')
  preview(@Body('rawCsvText') rawCsvText: string) {
    return this.importService.preview(rawCsvText);
  }

  @Post('commit')
  @UsePipes(new ZodValidationPipe(commitImportSchema))
  async commit(
    @CurrentUser() user: UserProfile,
    @Body() body: CommitImportInput
  ) {
    return this.importService.commit(user.id, body);
  }

  @Get()
  async list(@CurrentUser() user: UserProfile) {
    return this.importService.listImports(user.id);
  }

  @Delete(':id')
  async rollback(
    @CurrentUser() user: UserProfile,
    @Param('id') id: string
  ) {
    return this.importService.rollbackImport(user.id, id);
  }
}

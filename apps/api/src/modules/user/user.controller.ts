import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service.js';
import {
  updateProfileSchema,
  UpdateProfileInput,
} from '@subguard/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserProfile } from '@subguard/types';

@Controller('api/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: UserProfile) {
    return this.userService.getProfile(user.id);
  }

  @Patch('profile')
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  async updateProfile(
    @CurrentUser() user: UserProfile,
    @Body() body: UpdateProfileInput
  ) {
    return this.userService.updateProfile(user.id, body);
  }

  @Get('export')
  async exportData(@CurrentUser() user: UserProfile) {
    return this.userService.exportUserData(user.id);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser() user: UserProfile,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.userService.deleteAccount(user.id);
    res.clearCookie('subguard_session', { path: '/' });
    return result;
  }
}

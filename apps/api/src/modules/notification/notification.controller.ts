import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UsePipes,
} from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import {
  createReminderSchema,
  CreateReminderInput,
} from '@subguard/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserProfile } from '@subguard/types';

@Controller('api/v1')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('notifications')
  async listNotifications(@CurrentUser() user: UserProfile) {
    return this.notificationService.list(user.id);
  }

  @Patch('notifications/:id/read')
  async markRead(
    @CurrentUser() user: UserProfile,
    @Param('id') id: string
  ) {
    return this.notificationService.markAsRead(user.id, id);
  }

  @Post('notifications/read-all')
  async markAllRead(@CurrentUser() user: UserProfile) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Get('reminders')
  async listReminders(@CurrentUser() user: UserProfile) {
    return this.notificationService.listReminders(user.id);
  }

  @Post('reminders')
  @UsePipes(new ZodValidationPipe(createReminderSchema))
  async createReminder(
    @CurrentUser() user: UserProfile,
    @Body() body: CreateReminderInput
  ) {
    return this.notificationService.createReminder(user.id, body);
  }

  @Delete('reminders/:id')
  async deleteReminder(
    @CurrentUser() user: UserProfile,
    @Param('id') id: string
  ) {
    return this.notificationService.deleteReminder(user.id, id);
  }

  @Post('notifications/process')
  async triggerProcess() {
    return this.notificationService.processDueNotifications();
  }
}

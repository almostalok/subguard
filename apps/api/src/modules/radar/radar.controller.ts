import { Controller, Get, Query } from '@nestjs/common';
import { RadarService } from './radar.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserProfile } from '@subguard/types';

@Controller('api/v1/radar')
export class RadarController {
  constructor(private readonly radarService: RadarService) {}

  @Get('forecast')
  async getForecast(
    @CurrentUser() user: UserProfile,
    @Query('days') days?: string
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.radarService.getForecast(user.id, daysNum);
  }
}

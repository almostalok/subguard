import { Module } from '@nestjs/common';
import { RadarService } from './radar.service.js';
import { RadarController } from './radar.controller.js';

@Module({
  controllers: [RadarController],
  providers: [RadarService],
  exports: [RadarService],
})
export class RadarModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module.js';
import { SessionGuard } from './common/guards/session.guard.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { CommitmentModule } from './modules/commitment/commitment.module.js';
import { MandateModule } from './modules/mandate/mandate.module.js';
import { ImportModule } from './modules/import/import.module.js';
import { TransactionModule } from './modules/transaction/transaction.module.js';
import { DetectionModule } from './modules/detection/detection.module.js';
import { RadarModule } from './modules/radar/radar.module.js';
import { InsightsModule } from './modules/insights/insights.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    CommitmentModule,
    MandateModule,
    ImportModule,
    TransactionModule,
    DetectionModule,
    RadarModule,
    InsightsModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

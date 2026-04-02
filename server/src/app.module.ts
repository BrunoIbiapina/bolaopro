import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PoolsModule } from './modules/pools/pools.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { RankingsModule } from './modules/rankings/rankings.module';
import { SportsModule } from './modules/sports/sports.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { FootballDataModule } from './modules/football-data/football-data.module';
import { CausasModule } from './modules/causas/causas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PoolsModule,
    PredictionsModule,
    RankingsModule,
    SportsModule,
    PaymentsModule,
    NotificationsModule,
    AuditModule,
    FootballDataModule,
    CausasModule,
  ],
})
export class AppModule {}

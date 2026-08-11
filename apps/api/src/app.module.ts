import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QrCodesModule } from './qr-codes/qr-codes.module';
import { ScansModule } from './scans/scans.module';
import { RedirectModule } from './redirect/redirect.module';
import { TagsModule } from './tags/tags.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DATABASE_TYPE', 'better-sqlite3');
        if (dbType === 'postgres') {
          return {
            type: 'postgres' as const,
            url: config.get<string>('DATABASE_URL'),
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: true,
          };
        }
        return {
          type: 'better-sqlite3' as const,
          database: config.get<string>('DATABASE_PATH', 'data/scanforge.db'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    QrCodesModule,
    ScansModule,
    RedirectModule,
    TagsModule,
    DashboardModule,
    SeedModule,
  ],
})
export class AppModule {}

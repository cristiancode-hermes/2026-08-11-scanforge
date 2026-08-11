import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { QRCode } from '../qr-codes/qr-code.entity';
import { ScanEvent } from '../scans/scan-event.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([QRCode, ScanEvent]), AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { QRCode } from '../qr-codes/qr-code.entity';
import { QrCodesModule } from '../qr-codes/qr-codes.module';
import { ScanEvent } from './scan-event.entity';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScanEvent, QRCode]), AuthModule, QrCodesModule],
  controllers: [ScansController],
  providers: [ScansService],
  exports: [ScansService, TypeOrmModule],
})
export class ScansModule {}

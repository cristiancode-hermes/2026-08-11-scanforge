import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { QrService } from '../common/qr.service';
import { Tag } from '../tags/tag.entity';
import { QRCode } from './qr-code.entity';
import { QrCodesController } from './qr-codes.controller';
import { QrCodesService } from './qr-codes.service';
import { QrDownloadController } from './qr-download.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QRCode, Tag]), AuthModule],
  controllers: [QrCodesController, QrDownloadController],
  providers: [QrCodesService, QrService],
  exports: [QrCodesService, TypeOrmModule],
})
export class QrCodesModule {}

import { Module } from '@nestjs/common';
import { QrCodesModule } from '../qr-codes/qr-codes.module';
import { ScansModule } from '../scans/scans.module';
import { RedirectController } from './redirect.controller';

@Module({
  imports: [QrCodesModule, ScansModule],
  controllers: [RedirectController],
})
export class RedirectModule {}

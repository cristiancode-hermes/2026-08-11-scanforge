import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QRCode } from '../qr-codes/qr-code.entity';
import { ScanEvent } from '../scans/scan-event.entity';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, QRCode, ScanEvent, Tag])],
  providers: [SeedService],
})
export class SeedModule {}

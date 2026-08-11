import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { QRCode } from '../qr-codes/qr-code.entity';
import { Tag } from './tag.entity';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, QRCode]), AuthModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService, TypeOrmModule],
})
export class TagsModule {}

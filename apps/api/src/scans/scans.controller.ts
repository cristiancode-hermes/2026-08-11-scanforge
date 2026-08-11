import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QrCodesService } from '../qr-codes/qr-codes.service';
import { ScansService } from './scans.service';

@ApiTags('scans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ScansController {
  constructor(
    private readonly scansService: ScansService,
    private readonly qrCodesService: QrCodesService,
  ) {}

  @Get('qr-codes/:id/stats')
  async stats(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('range', new DefaultValuePipe(30), ParseIntPipe) range: number,
  ) {
    await this.qrCodesService.getById(userId, id);
    const safeRange = [7, 30, 90].includes(range) ? range : 30;
    return this.scansService.stats(id, safeRange);
  }

  @Get('qr-codes/:id/scans')
  async list(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    await this.qrCodesService.getById(userId, id);
    return this.scansService.list(id, page, Math.min(100, limit));
  }

  @Get('qr-codes/:id/scans/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment')
  async exportCsv(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const qr = await this.qrCodesService.getById(userId, id);
    const csv = await this.scansService.exportCsv(id);
    res.setHeader('Content-Disposition', `attachment; filename="scans-${qr.slug}.csv"`);
    res.send(csv);
  }

  @Delete('scans/:id')
  async remove(@CurrentUser('id') userId: string, @Param('id') scanId: string) {
    await this.scansService.remove(scanId);
    return { deleted: true };
  }

  @Delete('qr-codes/:id/scans')
  async clearForQr(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.qrCodesService.getById(userId, id);
    await this.scansService.clearForQr(id);
    return { cleared: true };
  }
}

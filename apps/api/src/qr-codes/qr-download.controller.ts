import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
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
import { QrService } from '../common/qr.service';
import { QrCodesService } from './qr-codes.service';

/**
 * Descarga del QR renderizado: PNG (300–1024px) y SVG vectorial.
 * La URL que codifica el QR es la ruta pública de escaneo /api/r/<slug>.
 */
@ApiTags('qr-codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qr-codes')
export class QrDownloadController {
  constructor(
    private readonly qrCodesService: QrCodesService,
    private readonly qrService: QrService,
  ) {}

  @Get(':id/download/png')
  @Header('Content-Type', 'image/png')
  async downloadPng(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('size', new DefaultValuePipe(512), ParseIntPipe) size: number,
    @Res() res: Response,
  ) {
    const qr = await this.qrCodesService.getById(userId, id);
    const safeSize = Math.min(1024, Math.max(300, size));
    const value = this.scanUrl(qr.slug);
    const buffer = await this.qrService.toPng(value, safeSize, {
      foregroundColor: qr.foregroundColor,
      backgroundColor: qr.backgroundColor,
    });
    res.setHeader('Content-Disposition', `attachment; filename="${qr.slug}.png"`);
    res.send(buffer);
  }

  @Get(':id/download/svg')
  @Header('Content-Type', 'image/svg+xml')
  async downloadSvg(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const qr = await this.qrCodesService.getById(userId, id);
    const value = this.scanUrl(qr.slug);
    const svg = await this.qrService.toSvg(value, {
      foregroundColor: qr.foregroundColor,
      backgroundColor: qr.backgroundColor,
    });
    res.setHeader('Content-Disposition', `attachment; filename="${qr.slug}.svg"`);
    res.send(svg);
  }

  /** URL pública de escaneo (misma que se imprime en el QR). */
  private scanUrl(slug: string): string {
    const host = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3045}`;
    return `${host}/api/r/${slug}`;
  }
}

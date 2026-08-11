import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { detectDevice, hashIp, parseLocale } from '../common/device-detector';
import { QrCodesService } from '../qr-codes/qr-codes.service';
import { ScansService } from '../scans/scans.service';

/**
 * Ruta pública de escaneo: GET /api/r/:slug → 302 al destino + registro
 * fire-and-forget del ScanEvent. Sin auth a propósito: los QR impresos
 * deben funcionar sin sesión.
 */
@ApiTags('redirect')
@Controller('r')
export class RedirectController {
  constructor(
    private readonly qrCodesService: QrCodesService,
    private readonly scansService: ScansService,
  ) {}

  @Get(':slug')
  async redirect(
    @Param('slug') slug: string,
    @Query('preview') preview: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const qr = await this.qrCodesService.getBySlug(slug);

    // preview=1 → JSON con metadatos (sin registrar escaneo)
    if (preview === '1') {
      if (!qr || !qr.isActive) throw new NotFoundException('QR not found');
      return res.json({
        title: qr.title,
        targetUrl: qr.targetUrl,
        foregroundColor: qr.foregroundColor,
        backgroundColor: qr.backgroundColor,
        style: qr.style,
      });
    }

    if (!qr || !qr.isActive) throw new NotFoundException('QR not found');

    // Fire-and-forget: registrar el escaneo sin bloquear el 302
    const ua = (req.headers['user-agent'] as string | undefined) ?? null;
    const referrer = (req.headers['referer'] as string | undefined) ?? null;
    const locale = parseLocale(req.headers['accept-language'] as string | undefined);
    const ip = req.ip ?? null;

    void this.scansService
      .record({
        qrCodeId: qr.id,
        referrer,
        userAgent: ua,
        deviceType: detectDevice(ua),
        locale,
        ipHash: hashIp(ip),
        metadata: { via: 'redirect' },
      })
      .catch((err) => {
        // El redirect nunca debe perderse por un fallo de registro
        // eslint-disable-next-line no-console
        console.error('Scan record failed:', err?.message ?? err);
      });

    return res.redirect(302, qr.targetUrl);
  }
}

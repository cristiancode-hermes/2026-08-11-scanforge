import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import type { QRCodeToBufferOptions, QRCodeToStringOptions } from 'qrcode';

export interface QrRenderOptions {
  foregroundColor?: string;
  backgroundColor?: string;
  style?: 'classic' | 'dots' | 'rounded';
}

/**
 * Wrapper sobre la librería `qrcode` (npm, sin APIs externas).
 * Genera PNG buffer (para descarga) y SVG string (vectorial).
 */
@Injectable()
export class QrService {
  /** PNG buffer del QR. size en px (300–1024). */
  async toPng(value: string, size: number, opts: QrRenderOptions = {}): Promise<Buffer> {
    const options: QRCodeToBufferOptions = {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: opts.foregroundColor ?? '#16181D',
        light: opts.backgroundColor ?? '#FFFFFF',
      },
    };
    return QRCode.toBuffer(value, options);
  }

  /** SVG string del QR (vectorial, sin tamaño fijo). */
  async toSvg(value: string, opts: QrRenderOptions = {}): Promise<string> {
    const options: QRCodeToStringOptions = {
      margin: 2,
      errorCorrectionLevel: 'M',
      type: 'svg',
      color: {
        dark: opts.foregroundColor ?? '#16181D',
        light: opts.backgroundColor ?? '#FFFFFF',
      },
    };
    return QRCode.toString(value, options);
  }
}

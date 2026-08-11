import { Component, ElementRef, afterNextRender, computed, input, viewChild } from '@angular/core';
import * as QRCode from 'qrcode';

/**
 * Preview en vivo del QR. Renderiza con la librería `qrcode` en canvas.
 * El QR SIEMPRE se muestra con sus colores propios (fg/bg del código),
 * nunca invertido por el theme.
 */
@Component({
  selector: 'app-qr-preview',
  standalone: true,
  template: `
    <div class="qr-frame" [style.background]="backgroundColor()">
      <canvas #canvas [style.width.px]="size()" [style.height.px]="size()"></canvas>
    </div>
  `,
})
export class QrPreviewComponent {
  readonly value = input.required<string>();
  readonly foregroundColor = input('#16181D');
  readonly backgroundColor = input('#FFFFFF');
  readonly size = input(180);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    afterNextRender(() => {
      this.render();
    });
  }

  private async render(): Promise<void> {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.value()) return;
    try {
      await QRCode.toCanvas(canvas, this.value(), {
        width: this.size(),
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: this.foregroundColor(),
          light: this.backgroundColor(),
        },
      });
    } catch {
      // valor inválido → canvas vacío, el form lo valida
    }
  }
}

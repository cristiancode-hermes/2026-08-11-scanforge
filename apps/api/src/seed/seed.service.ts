import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { QRCode } from '../qr-codes/qr-code.entity';
import { ScanEvent } from '../scans/scan-event.entity';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';
import { generateSlug } from '../common/slug-generator';
import { detectDevice } from '../common/device-detector';

/**
 * Seed demo: usuario + 4 códigos QR con escaneos distribuidos en los
 * últimos 90 días (para que el dashboard y las gráficas muestren datos).
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(QRCode) private readonly qrRepo: Repository<QRCode>,
    @InjectRepository(ScanEvent) private readonly scansRepo: Repository<ScanEvent>,
    @InjectRepository(Tag) private readonly tagsRepo: Repository<Tag>,
  ) {}

  async onModuleInit() {
    if (!this.config.get<string>('SEED_DB')) return;
    const existing = await this.usersRepo.findOne({ where: { email: 'demo@scanforge.app' } });
    if (existing) {
      this.logger.log('Seed ya aplicado — skip');
      return;
    }
    await this.seed();
  }

  async seed() {
    this.logger.log('Sembrando datos demo…');

    const passwordHash = await bcrypt.hash('demo1234', 10);
    const user = this.usersRepo.create({
      email: 'demo@scanforge.app',
      passwordHash,
      name: 'Demo',
    } as any);
    const savedUser = (await this.usersRepo.save(user)) as unknown as User;

    // Tags
    const tagInsta = (await this.tagsRepo.save(
      this.tagsRepo.create({ userId: savedUser.id, name: 'Instagram', color: '#E1306C' } as any),
    )) as unknown as Tag;
    const tagMenu = (await this.tagsRepo.save(
      this.tagsRepo.create({ userId: savedUser.id, name: 'Menú', color: '#16A34A' } as any),
    )) as unknown as Tag;
    const tagCards = (await this.tagsRepo.save(
      this.tagsRepo.create({ userId: savedUser.id, name: 'Tarjetas', color: '#0E7490' } as any),
    )) as unknown as Tag;

    // Códigos QR
    const qr1 = await this.saveQr(savedUser.id, 'Instagram perfil', 'https://instagram.com/cafeteriaaurora', 'insta', tagInsta.id);
    const qr2 = await this.saveQr(savedUser.id, 'Menú digital terraza', 'https://cafeteriaaurora.com/menu', 'menu', tagMenu.id);
    const qr3 = await this.saveQr(savedUser.id, 'Tarjeta visita — Aurora', 'https://cafeteriaaurora.com', 'aurora', tagCards.id);
    const qr4 = await this.saveQr(savedUser.id, 'Encuesta de satisfacción', 'https://forms.example.com/satisfaccion', 'encuesta', null);

    // Escaneos distribuidos en los últimos 90 días
    const referrers = [null, 'https://instagram.com/', 'https://t.co/', 'https://wa.me/', 'https://maps.google.com/'];
    const uas = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    ];
    const locales = ['es-ES', 'es', 'en-US', 'pt-BR', null];

    const qrs = [qr1, qr2, qr3, qr4];
    const weights = [0.45, 0.3, 0.15, 0.1]; // insta más escaneado

    let totalEvents = 0;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let day = 0; day < 90; day++) {
      for (let qi = 0; qi < qrs.length; qi++) {
        // Picos los fines de semana
        const d = new Date(now - day * dayMs);
        const weekend = d.getDay() === 0 || d.getDay() === 6;
        const base = weights[qi] * (weekend ? 1.4 : 1);
        const n = Math.random() < base ? 1 + Math.floor(Math.random() * 4) : 0;
        for (let k = 0; k < n; k++) {
          const ts = new Date(d.getTime() - Math.floor(Math.random() * dayMs));
          const ua = uas[Math.floor(Math.random() * uas.length)];
          const ref = referrers[Math.floor(Math.random() * referrers.length)];
          const loc = locales[Math.floor(Math.random() * locales.length)];
          await this.scansRepo.save(
            this.scansRepo.create({
              qrCodeId: qrs[qi].id,
              scannedAt: ts,
              referrer: ref,
              userAgent: ua,
              deviceType: detectDevice(ua),
              locale: loc,
              ipHash: `demo${(Math.random() * 1e9).toFixed(0).padStart(9, '0')}`,
              metadata: { via: 'seed' },
            } as any),
          );
          totalEvents++;
        }
      }
    }

    // Sincronizar scanCount desnormalizado
    for (const qr of qrs) {
      const count = await this.scansRepo.count({ where: { qrCodeId: qr.id } });
      await this.qrRepo.update({ id: qr.id }, { scanCount: count });
    }

    this.logger.log(`Seed completo: 1 usuario, 4 QR, 3 tags, ${totalEvents} escaneos`);
  }

  private async saveQr(
    userId: string,
    title: string,
    targetUrl: string,
    slugBase: string,
    tagId: string | null,
  ): Promise<QRCode> {
    const slug = `${slugBase}_${generateSlug(4)}`;
    const qr = this.qrRepo.create({
      userId,
      title,
      targetUrl,
      slug,
      foregroundColor: '#16181D',
      backgroundColor: '#FFFFFF',
      style: 'classic',
      isActive: true,
      scanCount: 0,
    } as any);
    const saved = (await this.qrRepo.save(qr)) as unknown as QRCode;
    if (tagId) {
      const tag = await this.tagsRepo.findOne({ where: { id: tagId } });
      if (tag) {
        saved.tags = [tag];
        await this.qrRepo.save(saved);
      }
    }
    return saved;
  }
}

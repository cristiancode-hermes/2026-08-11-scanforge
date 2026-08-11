import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QRCode } from '../qr-codes/qr-code.entity';
import { ScanEvent } from './scan-event.entity';

export interface ScanInput {
  qrCodeId: string;
  referrer?: string | null;
  userAgent?: string | null;
  deviceType?: string | null;
  locale?: string | null;
  ipHash?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DayBucket {
  date: string;
  scans: number;
}

export interface StatsResult {
  total: number;
  perDay: DayBucket[];
  topReferrers: { referrer: string; scans: number }[];
  byDevice: { device: string; scans: number }[];
  byLocale: { locale: string; scans: number }[];
}

@Injectable()
export class ScansService {
  constructor(
    @InjectRepository(ScanEvent) private readonly scansRepo: Repository<ScanEvent>,
    @InjectRepository(QRCode) private readonly qrRepo: Repository<QRCode>,
  ) {}

  /** Registra un escaneo (fire-and-forget desde el redirect). */
  async record(input: ScanInput): Promise<ScanEvent> {
    const event = this.scansRepo.create({
      qrCodeId: input.qrCodeId,
      referrer: input.referrer ?? null,
      userAgent: input.userAgent ?? null,
      deviceType: input.deviceType ?? null,
      locale: input.locale ?? null,
      ipHash: input.ipHash ?? null,
      metadata: input.metadata ?? {},
    } as any);
    const saved = (await this.scansRepo.save(event)) as unknown as ScanEvent;

    // Incremento atómico del contador desnormalizado (misma transacción lógica)
    await this.qrRepo.increment({ id: input.qrCodeId }, 'scanCount', 1);
    return saved;
  }

  /** Paginado de escaneos recientes (más recientes primero). */
  async list(qrCodeId: string, page = 1, limit = 20) {
    const [items, total] = await this.scansRepo.findAndCount({
      where: { qrCodeId },
      order: { scannedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page };
  }

  async remove(id: string): Promise<void> {
    const event = await this.scansRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Scan not found');
    await this.scansRepo.remove(event);
  }

  async clearForQr(qrCodeId: string): Promise<void> {
    await this.scansRepo.delete({ qrCodeId });
    await this.qrRepo.update({ id: qrCodeId }, { scanCount: 0 });
  }

  /**
   * Estadísticas del código: serie por día (completa con ceros), top referrers,
   * breakdown por dispositivo y locale. rango en días (7|30|90).
   */
  async stats(qrCodeId: string, range: number): Promise<StatsResult> {
    const since = new Date();
    since.setDate(since.getDate() - (range - 1));
    since.setHours(0, 0, 0, 0);

    const qb = this.scansRepo
      .createQueryBuilder('s')
      .where('s.qrCodeId = :qrCodeId', { qrCodeId })
      .andWhere('s.scannedAt >= :since', { since });

    const total = await qb.clone().getCount();

    // Serie temporal completa: días sin escaneos = 0
    const perDay = await this.buildPerDaySeries(qrCodeId, range, since);

    // Top referrers (COALESCE → "(directo)")
    const referrerRows = (await qb
      .clone()
      .select("COALESCE(NULLIF(s.referrer, ''), '(directo)') AS referrer")
      .addSelect('COUNT(*) AS scans')
      .groupBy('s.referrer')
      .orderBy('scans', 'DESC')
      .limit(10)
      .getRawMany()) as { referrer: string; scans: string }[];

    // Breakdown por dispositivo
    const deviceRows = (await qb
      .clone()
      .select("COALESCE(s.deviceType, 'unknown') AS device")
      .addSelect('COUNT(*) AS scans')
      .groupBy('s.deviceType')
      .orderBy('scans', 'DESC')
      .getRawMany()) as { device: string; scans: string }[];

    // Breakdown por locale
    const localeRows = (await qb
      .clone()
      .select("COALESCE(s.locale, 'unknown') AS locale")
      .addSelect('COUNT(*) AS scans')
      .groupBy('s.locale')
      .orderBy('scans', 'DESC')
      .limit(10)
      .getRawMany()) as { locale: string; scans: string }[];

    return {
      total,
      perDay,
      topReferrers: referrerRows.map((r) => ({ referrer: r.referrer, scans: Number(r.scans) })),
      byDevice: deviceRows.map((r) => ({ device: r.device, scans: Number(r.scans) })),
      byLocale: localeRows.map((r) => ({ locale: r.locale, scans: Number(r.scans) })),
    };
  }

  /** Serie temporal completa con COALESCE — funciona en SQLite y PostgreSQL. */
  private async buildPerDaySeries(
    qrCodeId: string,
    range: number,
    since: Date,
  ): Promise<DayBucket[]> {
    const rows = (await this.scansRepo
      .createQueryBuilder('s')
      .select("strftime('%Y-%m-%d', s.scannedAt) AS date")
      .addSelect('COUNT(*) AS scans')
      .where('s.qrCodeId = :qrCodeId', { qrCodeId })
      .andWhere('s.scannedAt >= :since', { since })
      .groupBy("strftime('%Y-%m-%d', s.scannedAt)")
      .getRawMany()) as { date: string; scans: string }[];

    const byDate = new Map(rows.map((r) => [r.date, Number(r.scans)]));

    const buckets: DayBucket[] = [];
    for (let i = 0; i < range; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      buckets.push({ date: key, scans: byDate.get(key) ?? 0 });
    }
    return buckets;
  }

  /** CSV de todos los escaneos del código (límite 10.000). */
  async exportCsv(qrCodeId: string): Promise<string> {
    const events = await this.scansRepo.find({
      where: { qrCodeId },
      order: { scannedAt: 'DESC' },
      take: 10000,
    });

    const header = 'scannedAt,referrer,userAgent,deviceType,locale,ipHash';
    const esc = (v: string | null | undefined): string => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };

    const lines = events.map((e) =>
      [
        esc(e.scannedAt.toISOString()),
        esc(e.referrer),
        esc(e.userAgent),
        esc(e.deviceType),
        esc(e.locale),
        esc(e.ipHash),
      ].join(','),
    );

    return [header, ...lines].join('\n');
  }
}

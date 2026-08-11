import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QRCode } from '../qr-codes/qr-code.entity';
import { ScanEvent } from '../scans/scan-event.entity';

export interface DashboardStats {
  totalCodes: number;
  totalScans: number;
  scansLast7d: number;
  avgPerDay7d: number;
  topCodes: { id: string; title: string; slug: string; scans: number }[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(QRCode) private readonly qrRepo: Repository<QRCode>,
    @InjectRepository(ScanEvent) private readonly scansRepo: Repository<ScanEvent>,
  ) {}

  async stats(userId: string): Promise<DashboardStats> {
    const totalCodes = await this.qrRepo.count({ where: { userId } });

    const scanCounts = await this.qrRepo
      .createQueryBuilder('q')
      .select('COALESCE(SUM(q.scanCount), 0)', 'total')
      .where('q.userId = :userId', { userId })
      .getRawOne<{ total: string | number }>();
    const totalScans = Number(scanCounts?.total ?? 0);

    // Escaneos últimos 7 días (join con qr_codes para scoping por usuario)
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const last7 = await this.scansRepo
      .createQueryBuilder('s')
      .innerJoin('s.qrCode', 'q')
      .where('q.userId = :userId', { userId })
      .andWhere('s.scannedAt >= :since', { since })
      .getCount();

    // Top 5 códigos por escaneos últimos 30 días
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const topRows = (await this.scansRepo
      .createQueryBuilder('s')
      .select('q.id', 'id')
      .addSelect('q.title', 'title')
      .addSelect('q.slug', 'slug')
      .addSelect('COUNT(s.id)', 'scans')
      .innerJoin('s.qrCode', 'q')
      .where('q.userId = :userId', { userId })
      .andWhere('s.scannedAt >= :since30', { since30 })
      .groupBy('q.id')
      .addGroupBy('q.title')
      .addGroupBy('q.slug')
      .orderBy('scans', 'DESC')
      .limit(5)
      .getRawMany()) as { id: string; title: string; slug: string; scans: string }[];

    return {
      totalCodes,
      totalScans,
      scansLast7d: last7,
      avgPerDay7d: last7 / 7,
      topCodes: topRows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        scans: Number(r.scans),
      })),
    };
  }
}

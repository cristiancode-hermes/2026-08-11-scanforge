import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QRCode } from '../qr-codes/qr-code.entity';
import { ScanEvent } from '../scans/scan-event.entity';

/** Mock encadenable de createQueryBuilder. */
function qbMock(overrides: Partial<Record<string, unknown>> = {}) {
  const qb: any = { ...overrides };
  qb.select = jest.fn().mockReturnValue(qb);
  qb.addSelect = jest.fn().mockReturnValue(qb);
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.innerJoin = jest.fn().mockReturnValue(qb);
  qb.groupBy = jest.fn().mockReturnValue(qb);
  qb.addGroupBy = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.limit = jest.fn().mockReturnValue(qb);
  return qb;
}

describe('DashboardService', () => {
  let service: DashboardService;
  let qrRepo: { count: jest.Mock; createQueryBuilder: jest.Mock };
  let scansRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    qrRepo = {
      count: jest.fn().mockResolvedValue(4),
      createQueryBuilder: jest.fn(() =>
        qbMock({ getRawOne: jest.fn().mockResolvedValue({ total: 231 }) }),
      ),
    };
    scansRepo = {
      createQueryBuilder: jest.fn(() =>
        qbMock({ getCount: jest.fn().mockResolvedValue(77), getRawMany: jest.fn().mockResolvedValue([]) }),
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(QRCode), useValue: qrRepo },
        { provide: getRepositoryToken(ScanEvent), useValue: scansRepo },
      ],
    }).compile();

    service = moduleRef.get(DashboardService);
  });

  it('devuelve totalCodes y totalScans del usuario', async () => {
    const stats = await service.stats('u1');
    expect(stats.totalCodes).toBe(4);
    expect(stats.totalScans).toBe(231);
    expect(stats.scansLast7d).toBe(77);
  });

  it('calcula media por día sobre escaneos de 7 días (last7/7)', async () => {
    const stats = await service.stats('u1');
    expect(stats.scansLast7d).toBe(77);
    expect(stats.avgPerDay7d).toBeCloseTo(77 / 7, 5);
  });

  it('incluye topCodes (array, máx 5)', async () => {
    const stats = await service.stats('u1');
    expect(Array.isArray(stats.topCodes)).toBe(true);
    expect(stats.topCodes.length).toBeLessThanOrEqual(5);
  });
});

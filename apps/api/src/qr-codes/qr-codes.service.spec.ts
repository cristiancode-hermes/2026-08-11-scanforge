import { Test } from '@nestjs/testing';
import { QrCodesService } from './qr-codes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QRCode } from './qr-code.entity';
import { Tag } from '../tags/tag.entity';
import { QrService } from '../common/qr.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

/** Repositorio simulado con estado en memoria que respeta where { id, userId }. */
function makeQrRepo() {
  let store: any[] = [];
  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  return {
    store,
    qb,
    findOne: jest.fn(async ({ where }: any) => {
      const w = Array.isArray(where) ? where[0] : where;
      return store.find((r) => Object.entries(w).every(([k, v]) => r[k] === v)) ?? null;
    }),
    save: jest.fn(async (entity: any) => {
      const idx = store.findIndex((r) => r.id === entity.id);
      if (idx >= 0) store[idx] = { ...store[idx], ...entity };
      else store.push(entity);
      return entity;
    }),
    create: jest.fn((entity: any) => ({ ...entity })),
    remove: jest.fn(async (entity: any) => {
      const idx = store.findIndex((r) => r.id === entity.id);
      if (idx >= 0) store.splice(idx, 1);
      return entity;
    }),
    increment: jest.fn(async () => ({})),
    findAndCount: jest.fn(async (): Promise<[any[], number]> => [[], 0]),
  };
}

describe('QrCodesService', () => {
  let service: QrCodesService;
  let qrRepo: ReturnType<typeof makeQrRepo> & { findAndCount: jest.Mock };
  let tagRepo: { find: jest.Mock };

  const mockQrService = { generatePngBuffer: jest.fn(), generateSvg: jest.fn() };

  beforeEach(async () => {
    qrRepo = makeQrRepo();
    qrRepo.store.push({
      id: 'q1',
      userId: 'u1',
      title: 'Test',
      targetUrl: 'https://example.com',
      slug: 'test1',
      foregroundColor: '#16181D',
      backgroundColor: '#FFFFFF',
      style: 'classic',
      isActive: true,
      scanCount: 0,
      tags: [],
    });
    tagRepo = { find: jest.fn().mockResolvedValue([]) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        QrCodesService,
        { provide: getRepositoryToken(QRCode), useValue: qrRepo },
        { provide: getRepositoryToken(Tag), useValue: tagRepo },
        { provide: QrService, useValue: mockQrService },
      ],
    }).compile();

    service = moduleRef.get(QrCodesService);
  });

  describe('create', () => {
    it('rechaza slug duplicado', async () => {
      await expect(
        service.create('u1', { title: 'X', targetUrl: 'https://a.com', slug: 'test1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza colores con contraste bajo (imprimible)', async () => {
      await expect(
        service.create('u1', {
          title: 'X',
          targetUrl: 'https://a.com',
          slug: 'abc12',
          foregroundColor: '#EEEEEE',
          backgroundColor: '#FFFFFF',
        }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('genera slug aleatorio si no se pasa', async () => {
      const qr = await service.create('u1', { title: 'X', targetUrl: 'https://a.com' });
      expect(qr.slug).toMatch(/^[a-z0-9]{6}$/);
    });

    it('crea con tagIds y devuelve QR con tags', async () => {
      tagRepo.find.mockResolvedValue([{ id: 't1', name: 'Menu' }]);
      const qr = await service.create('u1', {
        title: 'Menú',
        targetUrl: 'https://a.com/menu',
        slug: 'menu1',
        tagIds: ['t1'],
      });
      expect(qr.title).toBe('Menú');
      expect(qr.tags).toEqual([{ id: 't1', name: 'Menu' }]);
      expect(tagRepo.find).toHaveBeenCalled();
    });

    it('lanza BadRequest si un tagId no existe', async () => {
      tagRepo.find.mockResolvedValue([]);
      await expect(
        service.create('u1', { title: 'X', targetUrl: 'https://a.com', slug: 'abc12', tagIds: ['nope'] }),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('update', () => {
    it('lanza NotFound si el QR no existe', async () => {
      await expect(service.update('u1', 'nope', { title: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza NotFound si el QR es de otro usuario', async () => {
      await expect(service.update('u2', 'q1', { title: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('actualiza los campos editables', async () => {
      const qr = await service.update('u1', 'q1', { title: 'Nuevo título' });
      expect(qr.title).toBe('Nuevo título');
    });
  });

  describe('toggleActive / remove / getById / duplicate', () => {
    it('toggleActive invierte isActive', async () => {
      const res = await service.toggleActive('u1', 'q1');
      expect(res.isActive).toBe(false);
    });

    it('remove lanza NotFound para QR ajeno', async () => {
      await expect(service.remove('u2', 'q1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('remove borra el QR propio', async () => {
      await service.remove('u1', 'q1');
      expect(qrRepo.store.find((r) => r.id === 'q1')).toBeUndefined();
    });

    it('getById filtra por userId', async () => {
      const qr = await service.getById('u1', 'q1');
      expect(qr.id).toBe('q1');
      await expect(service.getById('u2', 'q1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('duplicate crea copia con slug nuevo y título "(copia)"', async () => {
      const copy = await service.duplicate('u1', 'q1');
      expect(copy.slug).toMatch(/^[a-z0-9]{6}$/);
      expect(copy.title).toBe('Test (copia)');
      expect(copy.scanCount).toBe(0);
      expect(qrRepo.store.length).toBe(2);
    });
  });

  describe('list', () => {
    it('devuelve items paginados del usuario', async () => {
      qrRepo.findAndCount.mockResolvedValue([[{ id: 'q1' }], 1]);
      const res = await service.list('u1', { page: 1, limit: 12 } as any);
      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
    });
  });
});

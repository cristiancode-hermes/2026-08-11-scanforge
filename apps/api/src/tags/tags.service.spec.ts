import { Test } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tag } from './tag.entity';
import { QRCode } from '../qr-codes/qr-code.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

function makeTagsRepo() {
  const store: any[] = [];
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
  };
  return {
    store,
    qb,
    findOne: jest.fn(async ({ where }: any) =>
      store.find((t) => Object.entries(where).every(([k, v]) => t[k] === v)) ?? null,
    ),
    find: jest.fn(async ({ where }: any) => store.filter((t) => t.userId === where.userId)),
    create: jest.fn((t: any) => ({ ...t })),
    save: jest.fn(async (t: any) => {
      const idx = store.findIndex((x) => x.id === t.id);
      if (idx >= 0) store[idx] = { ...store[idx], ...t };
      else store.push(t);
      return t;
    }),
    remove: jest.fn(async (t: any) => {
      const idx = store.findIndex((x) => x.id === t.id);
      if (idx >= 0) store.splice(idx, 1);
      return t;
    }),
  };
}

describe('TagsService', () => {
  let service: TagsService;
  let tagsRepo: ReturnType<typeof makeTagsRepo>;
  let qrRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    tagsRepo = makeTagsRepo();
    tagsRepo.store.push({ id: 't1', userId: 'u1', name: 'Menu', color: '#E1306C' });
    qrRepo = { createQueryBuilder: jest.fn(() => tagsRepo.qb) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: getRepositoryToken(Tag), useValue: tagsRepo },
        { provide: getRepositoryToken(QRCode), useValue: qrRepo },
      ],
    }).compile();

    service = moduleRef.get(TagsService);
  });

  it('lista solo tags del usuario con qrCount', async () => {
    const tags = await service.list('u1');
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('Menu');
    expect(tags[0].qrCount).toBe(0);
    expect(tagsRepo.qb.getCount).toHaveBeenCalled();
  });

  it('rechaza nombre duplicado para el mismo usuario', async () => {
    await expect(service.create('u1', 'Menu', '#E1306C')).rejects.toBeInstanceOf(ConflictException);
  });

  it('permite el mismo nombre para otro usuario', async () => {
    const tag = await service.create('u2', 'Menu', '#E1306C');
    expect(tag.name).toBe('Menu');
    expect(tag.userId).toBe('u2');
  });

  it('usa color por defecto si no se pasa', async () => {
    const tag = await service.create('u2', 'Sin color');
    expect(tag.color).toBe('#0E7490');
  });

  it('update lanza NotFound si el tag es de otro usuario', async () => {
    await expect(service.update('u2', 't1', 'Y')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update renombra y detecta duplicado ajeno', async () => {
    tagsRepo.store.push({ id: 't2', userId: 'u1', name: 'Instagram', color: '#16181D' });
    await expect(service.update('u1', 't1', 'Instagram')).rejects.toBeInstanceOf(ConflictException);
    const tag = await service.update('u1', 't1', 'Menú nuevo');
    expect(tag.name).toBe('Menú nuevo');
  });

  it('remove borra por id y usuario', async () => {
    await service.remove('u1', 't1');
    expect(tagsRepo.store.find((t) => t.id === 't1')).toBeUndefined();
    await expect(service.remove('u2', 't1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

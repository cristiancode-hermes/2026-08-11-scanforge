import { Test } from '@nestjs/testing';
import { ScansService } from './scans.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScanEvent } from './scan-event.entity';
import { QRCode } from '../qr-codes/qr-code.entity';
import { NotFoundException } from '@nestjs/common';
import { detectDevice } from '../common/device-detector';

describe('ScansService', () => {
  let service: ScansService;
  let scansRepo: {
    findAndCount: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let qrRepo: { findOne: jest.Mock; increment: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    scansRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      save: jest.fn().mockImplementation((s) => Promise.resolve({ ...s, id: 's1' })),
      create: jest.fn().mockImplementation((s) => ({ ...s })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn().mockResolvedValue({ id: 's1' }),
      remove: jest.fn().mockResolvedValue({ id: 's1' }),
    };
    qrRepo = {
      findOne: jest.fn(),
      increment: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ScansService,
        { provide: getRepositoryToken(ScanEvent), useValue: scansRepo },
        { provide: getRepositoryToken(QRCode), useValue: qrRepo },
      ],
    }).compile();

    service = moduleRef.get(ScansService);
  });

  describe('record', () => {
    it('registra escaneo y guarda referrer/device pasados', async () => {
      const ev = await service.record({
        qrCodeId: 'q1',
        referrer: 'https://instagram.com/',
        deviceType: 'mobile',
        locale: 'es-ES',
      });
      expect(ev.id).toBe('s1');
      expect(scansRepo.create).toHaveBeenCalled();
      const created = scansRepo.create.mock.calls[0][0];
      expect(created.qrCodeId).toBe('q1');
      expect(created.deviceType).toBe('mobile');
      expect(created.referrer).toBe('https://instagram.com/');
      expect(qrRepo.increment).toHaveBeenCalledWith({ id: 'q1' }, 'scanCount', 1);
    });

    it('no valida QR (la validación vive en el redirect controller)', async () => {
      qrRepo.findOne.mockResolvedValue(null);
      const ev = await service.record({ qrCodeId: 'nope' });
      expect(ev.id).toBe('s1'); // guarda igualmente
    });
  });

  describe('list / clearForQr', () => {
    it('list pagina escaneos de un QR', async () => {
      scansRepo.findAndCount.mockResolvedValue([[{ id: 's1' }], 1]);
      const res = await service.list('q1', 1, 10);
      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(scansRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ qrCodeId: 'q1' }),
        }),
      );
    });

    it('clearForQr borra escaneos de un QR', async () => {
      await service.clearForQr('q1');
      expect(scansRepo.delete).toHaveBeenCalledWith({ qrCodeId: 'q1' });
    });

    it('remove borra un escaneo por id', async () => {
      await service.remove('s1');
      expect(scansRepo.remove).toHaveBeenCalledWith({ id: 's1' });
    });
  });

  describe('detectDevice (helper)', () => {
    it('detecta iPhone como mobile', () => {
      expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe('mobile');
    });
    it('detecta iPad como tablet', () => {
      expect(detectDevice('Mozilla/5.0 (iPad; CPU OS 16_0)')).toBe('tablet');
    });
    it('detecta Windows como desktop', () => {
      expect(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop');
    });
    it('desconocido → bot', () => {
      expect(detectDevice('curl/8.0')).toBe('bot');
    });
  });
});

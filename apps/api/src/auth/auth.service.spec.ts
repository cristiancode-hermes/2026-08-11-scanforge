import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; delete: jest.Mock };

  const mockJwt = { sign: jest.fn().mockReturnValue('jwt-token') };

  const demoUser = {
    id: 'u1',
    email: 'demo@scanforge.app',
    name: 'Demo',
    passwordHash: bcrypt.hashSync('demo1234', 8),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    usersRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((u) => Promise.resolve({ ...u, id: 'new-id' })),
      create: jest.fn().mockImplementation((u) => ({ ...u })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('login — username-or-email', () => {
    it('busca con where array (email OR name) y firma token', async () => {
      usersRepo.findOne.mockResolvedValue(demoUser);
      const res = await service.login({ identifier: 'demo@scanforge.app', password: 'demo1234' });
      expect(res.token).toBe('jwt-token');
      expect(res.user.email).toBe('demo@scanforge.app');
      // debe usar where como array para aceptar email o nombre
      const whereArg = usersRepo.findOne.mock.calls[0][0].where;
      expect(Array.isArray(whereArg)).toBe(true);
      expect(whereArg[0]).toHaveProperty('email');
      expect(whereArg[1]).toHaveProperty('name');
    });

    it('rechaza contraseña incorrecta', async () => {
      usersRepo.findOne.mockResolvedValue(demoUser);
      await expect(service.login({ identifier: 'demo@scanforge.app', password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza usuario inexistente', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.login({ identifier: 'ghost', password: 'demo1234' })).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('normaliza email a minúsculas y hashea la contraseña', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const res = await service.register({ email: 'NUEVA@Scanforge.APP', password: 'secret123', name: 'Nueva' });
      expect(res.token).toBe('jwt-token');
      expect(res.user.email).toBe('nueva@scanforge.app'); // lowercased
      const saved = usersRepo.save.mock.calls[0][0];
      expect(saved.passwordHash).not.toBe('secret123');
      expect(saved.passwordHash.startsWith('$2')).toBe(true); // bcrypt
    });

    it('rechaza email duplicado', async () => {
      usersRepo.findOne.mockResolvedValue(demoUser);
      await expect(service.register({ email: 'demo@scanforge.app', password: 'secret123', name: 'X' })).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('me / updateProfile / changePassword / deleteAccount', () => {
    it('me devuelve el usuario sin passwordHash', async () => {
      usersRepo.findOne.mockResolvedValue(demoUser);
      const user = await service.me('u1');
      expect(user.id).toBe('u1');
      expect((user as any).passwordHash).toBeUndefined();
    });

    it('updateProfile cambia el nombre', async () => {
      usersRepo.findOne.mockResolvedValueOnce(demoUser).mockResolvedValueOnce(null);
      const user = await service.updateProfile('u1', { name: 'Nuevo nombre' });
      expect(user.name).toBe('Nuevo nombre');
    });

    it('changePassword valida la actual y regenera token', async () => {
      usersRepo.findOne.mockResolvedValue(demoUser);
      const res = await service.changePassword('u1', { currentPassword: 'demo1234', newPassword: 'nueva1234' });
      expect(res.token).toBe('jwt-token');
      const saved = usersRepo.save.mock.calls[0][0];
      expect(saved.passwordHash.startsWith('$2')).toBe(true);
    });

    it('changePassword rechaza contraseña actual incorrecta', async () => {
      usersRepo.findOne.mockResolvedValue(demoUser);
      await expect(service.changePassword('u1', { currentPassword: 'bad', newPassword: 'nueva1234' })).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('deleteAccount borra por id', async () => {
      await service.deleteAccount('u1');
      expect(usersRepo.delete).toHaveBeenCalledWith({ id: 'u1' });
    });
  });
});

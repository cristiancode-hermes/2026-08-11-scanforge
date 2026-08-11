import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from './dto/auth.dto';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ token: string; user: AuthUser }> {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name,
    } as any);
    const saved = (await this.usersRepo.save(user)) as unknown as User;

    return { token: this.signToken(saved), user: this.toAuthUser(saved) };
  }

  async login(dto: LoginDto): Promise<{ token: string; user: AuthUser }> {
    const user = await this.usersRepo.findOne({
      where: [{ email: dto.identifier.toLowerCase() }, { name: dto.identifier }],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { token: this.signToken(user), user: this.toAuthUser(user) };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.toAuthUser(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AuthUser> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (dto.email !== undefined) {
      const taken = await this.usersRepo.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (taken && taken.id !== userId) {
        throw new UnauthorizedException('Email already registered');
      }
      user.email = dto.email.toLowerCase();
    }
    if (dto.name !== undefined) user.name = dto.name;

    const saved = (await this.usersRepo.save(user)) as unknown as User;
    return this.toAuthUser(saved);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ token: string }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.save(user);
    // Regenera el token: las sesiones antiguas quedan inválidas
    return { token: this.signToken(user) };
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.usersRepo.delete({ id: userId });
  }

  private signToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }

  private toAuthUser(user: User): AuthUser {
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  }
}

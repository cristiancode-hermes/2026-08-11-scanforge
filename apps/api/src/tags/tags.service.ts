import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QRCode } from '../qr-codes/qr-code.entity';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private readonly tagsRepo: Repository<Tag>,
    @InjectRepository(QRCode) private readonly qrRepo: Repository<QRCode>,
  ) {}

  /** Lista de tags del usuario con contador de códigos asociados. */
  async list(userId: string) {
    const tags = await this.tagsRepo.find({
      where: { userId },
      order: { name: 'ASC' },
    });

    const withCounts = await Promise.all(
      tags.map(async (tag) => {
        const count = await this.qrRepo
          .createQueryBuilder('q')
          .innerJoin('q.tags', 't')
          .where('q.userId = :userId', { userId })
          .andWhere('t.id = :tagId', { tagId: tag.id })
          .getCount();
        return { ...tag, qrCount: count };
      }),
    );
    return withCounts;
  }

  async create(userId: string, name: string, color?: string) {
    const existing = await this.tagsRepo.findOne({ where: { userId, name } });
    if (existing) throw new ConflictException(`Tag '${name}' already exists`);

    const tag = this.tagsRepo.create({
      userId,
      name,
      color: color ?? '#0E7490',
    } as any);
    return (await this.tagsRepo.save(tag)) as unknown as Tag;
  }

  async update(userId: string, id: string, name?: string, color?: string) {
    const tag = await this.getOwned(userId, id);
    if (name !== undefined) {
      const dup = await this.tagsRepo.findOne({ where: { userId, name } });
      if (dup && dup.id !== id) {
        throw new ConflictException(`Tag '${name}' already exists`);
      }
      tag.name = name;
    }
    if (color !== undefined) tag.color = color;
    return (await this.tagsRepo.save(tag)) as unknown as Tag;
  }

  async remove(userId: string, id: string): Promise<void> {
    const tag = await this.getOwned(userId, id);
    await this.tagsRepo.remove(tag);
  }

  private async getOwned(userId: string, id: string): Promise<Tag> {
    const tag = await this.tagsRepo.findOne({ where: { id, userId } });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }
}

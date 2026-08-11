import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { Tag } from '../tags/tag.entity';
import { contrastRatio, generateSlug } from '../common/slug-generator';
import { QRCode } from './qr-code.entity';
import { CreateQrCodeDto, ListQrCodesDto, UpdateQrCodeDto } from './dto/qr-code.dto';

export interface QrListResult {
  items: QRCode[];
  total: number;
  page: number;
}

@Injectable()
export class QrCodesService {
  constructor(
    @InjectRepository(QRCode) private readonly qrRepo: Repository<QRCode>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
  ) {}

  async list(userId: string, query: ListQrCodesDto): Promise<QrListResult> {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 12) || 12));
    const sort = query.sort ?? 'createdAt';
    const order: 'ASC' | 'DESC' = query.order === 'asc' ? 'ASC' : 'DESC';

    const where: FindOptionsWhere<QRCode>[] = [];
    const base: FindOptionsWhere<QRCode> = { userId };

    if (query.search) {
      const like = ILike(`%${query.search}%`);
      where.push({ ...base, title: like }, { ...base, targetUrl: like });
    } else {
      where.push(base);
    }

    if (query.tagId) {
      for (const w of where) w.tags = { id: query.tagId };
    }

    const [items, total] = await this.qrRepo.findAndCount({
      where,
      relations: { tags: true },
      order: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page };
  }

  async getById(userId: string, id: string): Promise<QRCode> {
    const qr = await this.qrRepo.findOne({
      where: { id, userId },
      relations: { tags: true },
    });
    if (!qr) throw new NotFoundException('QR code not found');
    return qr;
  }

  async getBySlug(slug: string): Promise<QRCode | null> {
    return this.qrRepo.findOne({ where: { slug } });
  }

  async create(userId: string, dto: CreateQrCodeDto): Promise<QRCode> {
    if (dto.foregroundColor && dto.backgroundColor) {
      const ratio = contrastRatio(dto.foregroundColor, dto.backgroundColor);
      if (ratio < 3) {
        throw new BadRequestException(
          `Low contrast between colors (${ratio.toFixed(1)}:1) — QR may not scan when printed`,
        );
      }
    }

    const slug = dto.slug ?? (await this.generateUniqueSlug());
    if (dto.slug) {
      const taken = await this.qrRepo.findOne({ where: { slug } });
      if (taken) throw new ConflictException(`Slug '${slug}' is already taken`);
    }

    const qr = this.qrRepo.create({
      userId,
      title: dto.title,
      targetUrl: dto.targetUrl,
      slug,
      foregroundColor: dto.foregroundColor ?? '#16181D',
      backgroundColor: dto.backgroundColor ?? '#FFFFFF',
      style: dto.style ?? 'classic',
      isActive: true,
      scanCount: 0,
    } as any);
    const saved = (await this.qrRepo.save(qr)) as unknown as QRCode;

    if (dto.tagIds && dto.tagIds.length > 0) {
      saved.tags = await this.assignTags(userId, saved.id, dto.tagIds);
    }
    return this.getById(userId, saved.id);
  }

  async update(userId: string, id: string, dto: UpdateQrCodeDto): Promise<QRCode> {
    const qr = await this.getById(userId, id);

    if (dto.foregroundColor || dto.backgroundColor) {
      const fg = dto.foregroundColor ?? qr.foregroundColor;
      const bg = dto.backgroundColor ?? qr.backgroundColor;
      const ratio = contrastRatio(fg, bg);
      if (ratio < 3) {
        throw new BadRequestException(
          `Low contrast between colors (${ratio.toFixed(1)}:1) — QR may not scan when printed`,
        );
      }
    }

    if (dto.title !== undefined) qr.title = dto.title;
    if (dto.targetUrl !== undefined) qr.targetUrl = dto.targetUrl;
    if (dto.foregroundColor !== undefined) qr.foregroundColor = dto.foregroundColor;
    if (dto.backgroundColor !== undefined) qr.backgroundColor = dto.backgroundColor;
    if (dto.style !== undefined) qr.style = dto.style;
    if (dto.isActive !== undefined) qr.isActive = dto.isActive;

    const saved = (await this.qrRepo.save(qr)) as unknown as QRCode;
    return this.getById(userId, saved.id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const qr = await this.getById(userId, id);
    await this.qrRepo.remove(qr);
  }

  async duplicate(userId: string, id: string): Promise<QRCode> {
    const qr = await this.getById(userId, id);
    const slug = await this.generateUniqueSlug();
    const copy = this.qrRepo.create({
      userId,
      title: `${qr.title} (copia)`,
      targetUrl: qr.targetUrl,
      slug,
      foregroundColor: qr.foregroundColor,
      backgroundColor: qr.backgroundColor,
      style: qr.style,
      isActive: qr.isActive,
      scanCount: 0,
    } as any);
    const saved = (await this.qrRepo.save(copy)) as unknown as QRCode;
    return this.getById(userId, saved.id);
  }

  async toggleActive(userId: string, id: string): Promise<{ isActive: boolean }> {
    const qr = await this.getById(userId, id);
    qr.isActive = !qr.isActive;
    await this.qrRepo.save(qr);
    return { isActive: qr.isActive };
  }

  async setTags(userId: string, id: string, tagIds: string[]): Promise<QRCode> {
    const qr = await this.getById(userId, id);
    qr.tags = await this.assignTags(userId, id, tagIds);
    const saved = (await this.qrRepo.save(qr)) as unknown as QRCode;
    return this.getById(userId, saved.id);
  }

  async incrementScanCount(id: string): Promise<void> {
    await this.qrRepo.increment({ id }, 'scanCount', 1);
  }

  /** Genera slug único con retry de colisión (hasta 5 intentos). */
  private async generateUniqueSlug(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = generateSlug(6);
      const existing = await this.qrRepo.findOne({ where: { slug } });
      if (!existing) return slug;
    }
    // Fallback con más entropía
    return generateSlug(8);
  }

  /** Carga los tags escoped al usuario (OR por id+userId) y los asigna. */
  private async assignTags(userId: string, qrCodeId: string, tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    if (uniqueIds.length === 0) return [];
    const tags = await this.tagRepo.find({
      where: uniqueIds.map((id) => ({ id, userId })),
    });
    if (tags.length !== uniqueIds.length) {
      const found = new Set(tags.map((t) => t.id));
      const missing = uniqueIds.filter((id) => !found.has(id));
      throw new BadRequestException(`Tags not found: ${missing.join(', ')}`);
    }
    return tags;
  }
}

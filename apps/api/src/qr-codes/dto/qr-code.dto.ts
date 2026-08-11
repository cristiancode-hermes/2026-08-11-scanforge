import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const QR_STYLES = ['classic', 'dots', 'rounded'] as const;

export class CreateQrCodeDto {
  @ApiProperty({ example: 'Menú digital terraza', maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title: string;

  @ApiProperty({ example: 'https://cafeteria.example.com/menu' })
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  targetUrl: string;

  @ApiPropertyOptional({ example: 'terraza1', description: '4–12 chars [a-z0-9]. Auto si vacío' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]{4,12}$/, { message: 'slug must be 4-12 chars [a-z0-9]' })
  slug?: string;

  @ApiPropertyOptional({ example: '#16181D' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'foregroundColor must match /^#[0-9a-fA-F]{6}$/' })
  foregroundColor?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'backgroundColor must match /^#[0-9a-fA-F]{6}$/' })
  backgroundColor?: string;

  @ApiPropertyOptional({ enum: QR_STYLES, default: 'classic' })
  @IsOptional()
  @IsIn(QR_STYLES)
  style?: 'classic' | 'dots' | 'rounded';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}

export class UpdateQrCodeDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  targetUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  foregroundColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  backgroundColor?: string;

  @ApiPropertyOptional({ enum: QR_STYLES })
  @IsOptional()
  @IsIn(QR_STYLES)
  style?: 'classic' | 'dots' | 'rounded';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SetTagsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tagIds: string[];
}

export class ListQrCodesDto {
  @ApiPropertyOptional({ description: 'Busca en título y URL' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tagId?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'scanCount'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'scanCount'])
  sort?: 'createdAt' | 'scanCount';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @IsString()
  limit?: string;
}

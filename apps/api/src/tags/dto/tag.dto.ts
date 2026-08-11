import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'Instagram' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @ApiPropertyOptional({ example: '#0E7490' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsHexColor()
  color?: string;
}

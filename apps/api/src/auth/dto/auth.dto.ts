import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'sup3r-segura', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ana@example.com', description: 'Email o nombre' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'sup3r-segura' })
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;
}

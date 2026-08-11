import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService, AuthUser } from './auth.service';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteAccount(@CurrentUser('id') userId: string) {
    await this.authService.deleteAccount(userId);
    return { deleted: true };
  }
}

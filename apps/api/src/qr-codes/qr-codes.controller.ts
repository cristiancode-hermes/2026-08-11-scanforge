import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateQrCodeDto,
  ListQrCodesDto,
  SetTagsDto,
  UpdateQrCodeDto,
} from './dto/qr-code.dto';
import { QrCodesService } from './qr-codes.service';

@ApiTags('qr-codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qr-codes')
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query() query: ListQrCodesDto) {
    return this.qrCodesService.list(userId, query);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateQrCodeDto) {
    return this.qrCodesService.create(userId, dto);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.qrCodesService.getById(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQrCodeDto,
  ) {
    return this.qrCodesService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.qrCodesService.remove(userId, id);
    return { deleted: true };
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.qrCodesService.duplicate(userId, id);
  }

  @Post(':id/toggle-active')
  toggleActive(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.qrCodesService.toggleActive(userId, id);
  }

  @Post(':id/tags')
  setTags(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SetTagsDto,
  ) {
    return this.qrCodesService.setTags(userId, id, dto.tagIds);
  }
}

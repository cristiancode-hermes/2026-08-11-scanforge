import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { TagsService } from './tags.service';

@ApiTags('tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.tagsService.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTagDto) {
    return this.tagsService.create(userId, dto.name, dto.color);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagsService.update(userId, id, dto.name, dto.color);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.tagsService.remove(userId, id);
    return { deleted: true };
  }
}

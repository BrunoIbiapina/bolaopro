import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ChampionshipsService } from './championships.service';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';

@ApiTags('Sports')
@Controller('admin/championships')
export class ChampionshipsController {
  constructor(private championshipsService: ChampionshipsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a championship (any authenticated user)' })
  createChampionship(@Body() createChampionshipDto: CreateChampionshipDto) {
    return this.championshipsService.createChampionship(createChampionshipDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all championships' })
  getAllChampionships() {
    return this.championshipsService.getAllChampionships();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get championship by ID' })
  getChampionshipById(@Param('id') id: string) {
    return this.championshipsService.getChampionshipById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update championship (admin only)' })
  updateChampionship(
    @Param('id') id: string,
    @Body() updateChampionshipDto: UpdateChampionshipDto,
  ) {
    return this.championshipsService.updateChampionship(id, updateChampionshipDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete championship (admin only)' })
  deleteChampionship(@Param('id') id: string) {
    return this.championshipsService.deleteChampionship(id);
  }
}

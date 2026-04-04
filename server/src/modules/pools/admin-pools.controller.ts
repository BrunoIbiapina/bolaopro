import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PoolsService } from './pools.service';

@ApiTags('Admin - Pools')
@Controller('admin/pools')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('access-token')
export class AdminPoolsController {
  constructor(private poolsService: PoolsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all pools' })
  listAllPools(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.poolsService.listAllPoolsAdmin({ status, search });
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: update pool status (OPEN / CLOSED / FINISHED)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.poolsService.updatePoolStatusAdmin(id, body.status);
  }
}

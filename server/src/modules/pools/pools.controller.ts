import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { PoolsService } from './pools.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import { UpdatePoolDto } from './dto/update-pool.dto';
import { JoinPoolDto } from './dto/join-pool.dto';

@ApiTags('Pools')
@Controller('pools')
export class PoolsController {
  constructor(private poolsService: PoolsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new pool' })
  createPool(@CurrentUser() user: JwtPayload, @Body() createPoolDto: CreatePoolDto) {
    return this.poolsService.createPool(user.id, createPoolDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Get user's pools" })
  listPools(@CurrentUser() user: JwtPayload) {
    return this.poolsService.listUserPools(user.id);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all open pools not yet joined' })
  listAvailable(@CurrentUser() user: JwtPayload) {
    return this.poolsService.listAvailablePools(user.id);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join pool by invite code' })
  joinByCode(@CurrentUser() user: JwtPayload, @Body() body: { inviteCode: string; numCotas?: number }) {
    return this.poolsService.joinByInviteCode(user.id, body.inviteCode, body.numCotas ?? 1);
  }

  @Get('invite/:code')
  @ApiOperation({ summary: 'Get pool info by invite code (public)' })
  getByInviteCode(@Param('code') code: string) {
    return this.poolsService.getPoolByInviteCode(code);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get pool details' })
  getPool(@Param('id') id: string) {
    return this.poolsService.getPoolById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update pool (organizer only)' })
  updatePool(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updatePoolDto: UpdatePoolDto,
  ) {
    return this.poolsService.updatePool(id, user.id, updatePoolDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete pool (organizer only)' })
  deletePool(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.poolsService.deletePool(id, user.id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join pool with invite code' })
  joinPool(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() joinPoolDto: JoinPoolDto,
  ) {
    return this.poolsService.joinPool(id, user.id, joinPoolDto);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a pool' })
  leavePool(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.poolsService.leavePool(id, user.id);
  }

  @Get(':id/prize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get prize info (total em caixa, prêmio potencial)' })
  getPrizeInfo(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.poolsService.getPrizeInfo(id, user.id);
  }

  @Patch(':id/winners/:winnerId/prize-paid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark prize as paid to winner (organizer only)' })
  markPrizePaid(
    @Param('id') id: string,
    @Param('winnerId') winnerId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { prizeAmount: number },
  ) {
    return this.poolsService.markPrizePaid(id, winnerId, user.id, body.prizeAmount);
  }

  @Delete(':id/winners/:winnerId/prize-paid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unmark prize paid (organizer only)' })
  unmarkPrizePaid(
    @Param('id') id: string,
    @Param('winnerId') winnerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.poolsService.unmarkPrizePaid(id, winnerId, user.id);
  }

  @Get(':id/matches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get matches for this pool (specific or all from championship)' })
  getPoolMatches(@Param('id') id: string) {
    return this.poolsService.getPoolMatches(id);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get pool members' })
  getMembers(@Param('id') id: string) {
    return this.poolsService.getPoolMembers(id);
  }

  @Patch(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update member status (organizer only)' })
  updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
    @Body() data: { status: string },
  ) {
    return this.poolsService.updateMemberStatus(id, memberId, user.id, data.status);
  }
}

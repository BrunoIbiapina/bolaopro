import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { CausasService } from './causas.service';
import { CausasVotesService } from './causas-votes.service';
import { CausasResolutionService } from './causas-resolution.service';
import { CausasPaymentService } from './causas-payment.service';
import { CreateCausaDto } from './dto/create-causa.dto';
import { VoteCausaDto } from './dto/vote-causa.dto';
import { ResolveCausaDto } from './dto/resolve-causa.dto';
import { ListCausasDto } from './dto/list-causas.dto';

@Controller('causas')
export class CausasController {
  constructor(
    private causasService: CausasService,
    private votesService: CausasVotesService,
    private resolutionService: CausasResolutionService,
    private paymentService: CausasPaymentService,
  ) {}

  // ── Feed público (auth opcional: inclui causas privadas do próprio usuário) ──
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  listPublic(@Query() dto: ListCausasDto, @Request() req: any) {
    return this.causasService.listPublic(dto, req.user?.id);
  }

  @Get('invite/:code')
  findByInviteCode(@Param('code') code: string) {
    return this.causasService.findByInviteCode(code);
  }

  // ── Autenticados ──────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() dto: CreateCausaDto) {
    return this.causasService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  listMy(@Request() req: any) {
    return this.causasService.listMy(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.causasService.findOne(id, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string, @Request() req: any) {
    return this.causasService.publish(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  close(@Param('id') id: string, @Request() req: any) {
    return this.causasService.close(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.causasService.cancel(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  resolve(@Param('id') id: string, @Request() req: any, @Body() dto: ResolveCausaDto) {
    return this.resolutionService.resolve(id, req.user.id, req.user.role, dto);
  }

  // ── Votos ─────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post(':id/vote')
  @HttpCode(HttpStatus.OK)
  vote(@Param('id') id: string, @Request() req: any, @Body() dto: VoteCausaDto) {
    return this.votesService.vote(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/creator-join')
  @HttpCode(HttpStatus.OK)
  creatorJoin(@Param('id') id: string, @Request() req: any, @Body() dto: VoteCausaDto) {
    return this.votesService.creatorJoin(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/vote')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeVote(@Param('id') id: string, @Request() req: any) {
    return this.votesService.removeVote(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/my-vote')
  getMyVote(@Param('id') id: string, @Request() req: any) {
    return this.votesService.getMyVote(id, req.user.id);
  }

  @Get(':id/votes')
  getVotesSummary(@Param('id') id: string, @Request() req: any) {
    return this.causasService.getVotesSummary(id, req.user?.id);
  }

  @Get(':id/participants')
  getParticipants(@Param('id') id: string, @Request() req: any) {
    return this.causasService.getParticipants(id, req.user?.id);
  }

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.causasService.getLeaderboard(id);
  }

  // ── Pagamentos (usuário) ──────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post(':id/payment/generate')
  @HttpCode(HttpStatus.OK)
  generatePayment(@Param('id') id: string, @Request() req: any) {
    return this.paymentService.getOrCreatePayment(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/payment')
  getPaymentStatus(@Param('id') id: string, @Request() req: any) {
    return this.paymentService.getPaymentStatus(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/payment/notify-paid')
  @HttpCode(HttpStatus.OK)
  notifyPaid(@Param('id') id: string, @Request() req: any) {
    return this.paymentService.notifyPaid(id, req.user.id);
  }
}

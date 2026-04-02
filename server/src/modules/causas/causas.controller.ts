import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
  HttpCode, HttpStatus,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CausasService } from './causas.service';
import { CausasVotesService } from './causas-votes.service';
import { CausasResolutionService } from './causas-resolution.service';
import { CreateCausaDto } from './dto/create-causa.dto';
import { VoteCausaDto } from './dto/vote-causa.dto';
import { ResolveCausaDto } from './dto/resolve-causa.dto';
import { ListCausasDto } from './dto/list-causas.dto';

// ─── Admin Controller ─────────────────────────────────────────

@Controller('admin/causas-payments')
@UseGuards(JwtAuthGuard)
export class AdminCausasPaymentsController {
  constructor(private votesService: CausasVotesService) {}

  @Get('pending')
  getAllPending(@Request() req: any) {
    return this.votesService.getAllPendingPaymentsAdmin(req.user.role);
  }

  @Get('kpis')
  getKpis(@Request() req: any) {
    return this.votesService.getCausasFinanceKpis(req.user.role);
  }

  @Post(':causaId/confirm/:userId')
  @HttpCode(HttpStatus.OK)
  confirmPayment(
    @Param('causaId') causaId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.votesService.confirmPayment(causaId, req.user.id, userId, req.user.role);
  }
}

@Controller('causas')
export class CausasController {
  constructor(
    private causasService: CausasService,
    private votesService: CausasVotesService,
    private resolutionService: CausasResolutionService,
  ) {}

  // ── Feed público (sem auth) ────────────────────────────────────
  @Get()
  listPublic(@Query() dto: ListCausasDto) {
    return this.causasService.listPublic(dto);
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
  publish(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.causasService.publish(id, req.user.id, req.user.role, {
      asScheduled:   body?.asScheduled   ?? false,
      isFeatured:    body?.isFeatured    ?? false,
      scheduledOpenAt: body?.scheduledOpenAt,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/open')
  @HttpCode(HttpStatus.OK)
  openScheduled(@Param('id') id: string, @Request() req: any) {
    return this.causasService.openScheduled(id, req.user.id, req.user.role);
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

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.causasService.getLeaderboard(id);
  }

  // ── Pagamentos ────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':id/vote/notify-paid')
  @HttpCode(HttpStatus.OK)
  notifyPaid(@Param('id') id: string, @Request() req: any) {
    return this.votesService.notifyPaid(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/vote/:userId/confirm-payment')
  @HttpCode(HttpStatus.OK)
  confirmPayment(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.votesService.confirmPayment(id, req.user.id, userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/vote/:userId/reject-payment')
  @HttpCode(HttpStatus.OK)
  rejectPayment(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.votesService.rejectPayment(id, req.user.id, userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/pending-payments')
  getPendingPayments(@Param('id') id: string, @Request() req: any) {
    return this.votesService.getPendingPayments(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/vote/proof')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = './uploads/causa-proofs';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `causa_proof_${Date.now()}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new BadRequestException('Formato inválido. Use JPG, PNG ou PDF.'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadProof(
    @Param('id') id: string,
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const proofUrl = `/uploads/causa-proofs/${file.filename}`;
    return this.votesService.saveProof(id, req.user.id, proofUrl);
  }
}

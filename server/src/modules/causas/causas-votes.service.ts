import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VoteCausaDto } from './dto/vote-causa.dto';

@Injectable()
export class CausasVotesService {
  constructor(private prisma: PrismaService) {}

  // ── Votar / Alterar voto ──────────────────────────────────────

  async vote(causaId: string, userId: string, dto: VoteCausaDto) {
    const causa = await this.prisma.causa.findUnique({
      where: { id: causaId },
      include: { options: true },
    });

    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.status !== 'OPEN') throw new BadRequestException('Causa não está aberta para votação');
    if (new Date() > causa.deadlineAt) throw new BadRequestException('Prazo de votação encerrado');

    // Criador não pode votar na própria causa (mas pode optar ao publicar)
    if (causa.creatorId === userId) {
      throw new ForbiddenException('Use a opção de participar ao publicar a causa');
    }

    // Limite de participantes
    if (causa.maxVoters) {
      const count = await this.prisma.causaVote.count({ where: { causaId } });
      const existing = await this.prisma.causaVote.findUnique({
        where: { causaId_userId: { causaId, userId } },
      });
      if (!existing && count >= causa.maxVoters) {
        throw new BadRequestException('Limite de participantes atingido');
      }
    }

    // Validar entrada conforme o tipo
    if (causa.type === 'BINARY' || causa.type === 'CHOICE') {
      if (!dto.optionId) throw new BadRequestException('optionId é obrigatório');
      const optionExists = causa.options.some((o) => o.id === dto.optionId);
      if (!optionExists) throw new BadRequestException('Opção inválida para esta causa');
    }

    if (causa.type === 'NUMERIC') {
      if (dto.numericValue === undefined || dto.numericValue === null) {
        throw new BadRequestException('numericValue é obrigatório para causa NUMERIC');
      }
    }

    // Cotas
    const numCotas = dto.numCotas ?? 1;
    if (numCotas > causa.cotasPerParticipant) {
      throw new BadRequestException(
        `Máximo de ${causa.cotasPerParticipant} cotas por participante`,
      );
    }

    const amount = causa.entryFee * numCotas;

    // Upsert do voto
    const vote = await this.prisma.causaVote.upsert({
      where: { causaId_userId: { causaId, userId } },
      create: {
        causaId,
        userId,
        optionId: dto.optionId,
        numericValue: dto.numericValue,
        numCotas,
        amount,
        isCorrect: null,
      },
      update: {
        optionId: dto.optionId,
        numericValue: dto.numericValue,
        numCotas,
        amount,
      },
      include: {
        option: true,
      },
    });

    // Atualizar prizePool da causa (soma líquida dos amounts)
    await this.recalcPrizePool(causaId);

    return vote;
  }

  // ── Criador participa da própria causa ────────────────────────

  async creatorJoin(causaId: string, userId: string, dto: VoteCausaDto) {
    const causa = await this.prisma.causa.findUnique({
      where: { id: causaId },
      include: { options: true },
    });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.creatorId !== userId) throw new ForbiddenException('Apenas o criador pode usar este endpoint');
    if (causa.status !== 'OPEN') throw new BadRequestException('Causa não está aberta');

    return this.doVote(causa, userId, dto);
  }

  // ── Retirar voto ──────────────────────────────────────────────

  async removeVote(causaId: string, userId: string) {
    const causa = await this.prisma.causa.findUnique({ where: { id: causaId } });
    if (!causa) throw new NotFoundException('Causa não encontrada');
    if (causa.status !== 'OPEN' || new Date() > causa.deadlineAt) {
      throw new BadRequestException('Não é possível remover voto após o prazo');
    }

    await this.prisma.causaVote.delete({
      where: { causaId_userId: { causaId, userId } },
    });

    await this.recalcPrizePool(causaId);
  }

  // ── Meu voto atual ────────────────────────────────────────────

  async getMyVote(causaId: string, userId: string) {
    return this.prisma.causaVote.findUnique({
      where: { causaId_userId: { causaId, userId } },
      include: { option: true },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  private async doVote(causa: any, userId: string, dto: VoteCausaDto) {
    const numCotas = dto.numCotas ?? 1;
    const amount = causa.entryFee * numCotas;

    const vote = await this.prisma.causaVote.upsert({
      where: { causaId_userId: { causaId: causa.id, userId } },
      create: {
        causaId: causa.id,
        userId,
        optionId: dto.optionId,
        numericValue: dto.numericValue,
        numCotas,
        amount,
        isCorrect: null,
      },
      update: {
        optionId: dto.optionId,
        numericValue: dto.numericValue,
        numCotas,
        amount,
      },
    });

    await this.recalcPrizePool(causa.id);
    return vote;
  }

  private async recalcPrizePool(causaId: string) {
    const causa = await this.prisma.causa.findUnique({ where: { id: causaId } });
    if (!causa) return;

    const agg = await this.prisma.causaVote.aggregate({
      where: { causaId },
      _sum: { amount: true },
    });

    const grossPool = agg._sum.amount ?? 0;
    const platformFeeAmount = grossPool * (causa.platformFeePercent / 100);
    const prizePool = grossPool - platformFeeAmount;

    await this.prisma.causa.update({
      where: { id: causaId },
      data: { prizePool, platformFeeAmount },
    });
  }
}

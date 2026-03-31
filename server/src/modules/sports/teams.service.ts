import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async createTeam(createTeamDto: CreateTeamDto) {
    try {
      return await this.prisma.team.create({
        data: {
          name: createTeamDto.name,
          code: createTeamDto.code,
          logo: createTeamDto.logo,
          country: createTeamDto.country,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Já existe um time com esse nome ou código');
      }
      throw err;
    }
  }

  async getAllTeams() {
    return this.prisma.team.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getTeamById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    return team;
  }

  async updateTeam(id: string, updateTeamDto: UpdateTeamDto) {
    await this.getTeamById(id);

    return this.prisma.team.update({
      where: { id },
      data: {
        ...(updateTeamDto.name && { name: updateTeamDto.name }),
        ...(updateTeamDto.logo !== undefined && { logo: updateTeamDto.logo }),
        ...(updateTeamDto.country && { country: updateTeamDto.country }),
      },
    });
  }

  async deleteTeam(id: string) {
    await this.getTeamById(id);

    try {
      await this.prisma.team.delete({
        where: { id },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new BadRequestException(
          'Não é possível excluir este time pois ele possui partidas cadastradas',
        );
      }
      throw err;
    }

    return { message: 'Time excluído com sucesso' };
  }
}

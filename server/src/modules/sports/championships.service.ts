import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';

@Injectable()
export class ChampionshipsService {
  constructor(private prisma: PrismaService) {}

  async createChampionship(createChampionshipDto: CreateChampionshipDto) {
    return this.prisma.championship.create({
      data: {
        name: createChampionshipDto.name,
        code: createChampionshipDto.code,
        description: createChampionshipDto.description,
        startDate: createChampionshipDto.startDate,
        endDate: createChampionshipDto.endDate,
      },
    });
  }

  async getAllChampionships() {
    return this.prisma.championship.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { matches: true, pools: true },
        },
      },
    });
  }

  async getChampionshipById(id: string) {
    const championship = await this.prisma.championship.findUnique({
      where: { id },
      include: {
        matches: true,
        pools: true,
      },
    });

    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    return championship;
  }

  async updateChampionship(
    id: string,
    updateChampionshipDto: UpdateChampionshipDto,
  ) {
    const championship = await this.getChampionshipById(id);

    return this.prisma.championship.update({
      where: { id },
      data: {
        ...(updateChampionshipDto.name && { name: updateChampionshipDto.name }),
        ...(updateChampionshipDto.description && {
          description: updateChampionshipDto.description,
        }),
        ...(updateChampionshipDto.startDate && {
          startDate: updateChampionshipDto.startDate,
        }),
        ...(updateChampionshipDto.endDate && {
          endDate: updateChampionshipDto.endDate,
        }),
      },
    });
  }

  async deleteChampionship(id: string) {
    await this.getChampionshipById(id);

    await this.prisma.championship.delete({
      where: { id },
    });

    return { message: 'Championship deleted successfully' };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

export interface AuditLogInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  userId?: string;
  oldData?: any;
  newData?: any;
  req?: Request;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    const ipAddress = input.req
      ? (input.req.headers['x-forwarded-for'] as string) ||
        input.req.socket.remoteAddress ||
        'unknown'
      : 'unknown';

    const userAgent = input.req
      ? (input.req.headers['user-agent'] as string) || 'unknown'
      : 'unknown';

    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId,
        oldData: input.oldData ? JSON.stringify(input.oldData) : null,
        newData: input.newData ? JSON.stringify(input.newData) : null,
        ipAddress,
        userAgent,
      },
    });
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters: {
      action?: string;
      entityType?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = {};

    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const total = await this.prisma.auditLog.count({ where });
    const logs = await this.prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

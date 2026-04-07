import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CausasPaymentService } from './causas-payment.service';

@Controller('admin/causas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCausasController {
  constructor(private paymentService: CausasPaymentService) {}

  // ── Pagamentos de uma causa específica ───────────────────────
  @Get(':id/payments')
  listPaymentsByCausa(@Param('id') id: string) {
    return this.paymentService.listPaymentsByCausa(id);
  }

  @Post(':id/payments/:userId/confirm')
  @HttpCode(HttpStatus.OK)
  confirmPayment(
    @Param('id') causaId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.paymentService.confirmPayment(causaId, userId, req.user.id);
  }

  @Post(':id/payments/:userId/reject')
  @HttpCode(HttpStatus.OK)
  rejectPayment(
    @Param('id') causaId: string,
    @Param('userId') userId: string,
  ) {
    return this.paymentService.rejectPayment(causaId, userId);
  }

  // ── Todos os pagamentos de causas ─────────────────────────────
  @Get('payments/all')
  listAllPayments(@Query('status') status?: string) {
    return this.paymentService.listAllPayments(status);
  }
}

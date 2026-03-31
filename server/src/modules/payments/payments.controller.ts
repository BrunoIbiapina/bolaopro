import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { PaymentsService } from './payments.service';

@ApiTags('Admin - Payments')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: list all pending payments' })
  getPendingPayments() {
    return this.paymentsService.getPendingPaymentsAdmin();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: list all payments with filters' })
  getAllPayments(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('poolId') poolId?: string,
  ) {
    return this.paymentsService.getAllPaymentsAdmin({ status, search, startDate, endDate, poolId });
  }

  @Get('kpis')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: finance KPIs' })
  getKpis() {
    return this.paymentsService.getFinanceKpis();
  }

  @Get('pools-list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: pools with payments' })
  getPoolsList() {
    return this.paymentsService.getPoolsWithPayments();
  }

  @Get('members-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: all members with payment status across paid pools' })
  getMembersStatus() {
    return this.paymentsService.getAllMembersWithPaymentStatus();
  }

  @Post(':poolId/confirm/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: manually confirm payment' })
  confirmPayment(
    @Param('poolId') poolId: string,
    @Param('userId') userId: string,
    @CurrentUser() requester: JwtPayload,
  ) {
    return this.paymentsService.confirmPaymentManual(poolId, userId, requester.id);
  }

  @Post(':poolId/reject/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: reject / mark payment as not completed' })
  rejectPayment(
    @Param('poolId') poolId: string,
    @Param('userId') userId: string,
    @CurrentUser() requester: JwtPayload,
  ) {
    return this.paymentsService.rejectPaymentAdmin(poolId, userId, requester.id);
  }
}

@ApiTags('Payments')
@Controller('pools/:poolId/payment')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment status for pool' })
  getPaymentStatus(
    @Param('poolId') poolId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.getPaymentStatus(poolId, user.id);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate payment link' })
  generatePaymentLink(
    @Param('poolId') poolId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.generatePaymentLink(poolId, user.id);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment webhook handler' })
  handleWebhook(
    @Param('provider') provider: string,
    @Body() data: { transactionId: string; status: string },
  ) {
    return this.paymentsService.handlePaymentWebhook(data.transactionId, data.status);
  }

  @Post('notify-paid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User confirms payment was sent — notifies admin' })
  notifyPaid(
    @Param('poolId') poolId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.notifyPaymentSent(poolId, user.id);
  }

  @Post('confirm/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually confirm payment for a user (organizer/admin)' })
  confirmManual(
    @Param('poolId') poolId: string,
    @Param('userId') userId: string,
    @CurrentUser() requester: JwtPayload,
  ) {
    return this.paymentsService.confirmPaymentManual(poolId, userId, requester.id);
  }

  @Get('all-payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all payments for pool' })
  getPoolPayments(@Param('poolId') poolId: string) {
    return this.paymentsService.getPoolPayments(poolId);
  }

  @Post('proof')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload payment proof (comprovante)' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = './uploads/proofs';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `proof_${Date.now()}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new BadRequestException('Formato inválido. Use JPG, PNG ou PDF.'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadProof(
    @Param('poolId') poolId: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const proofUrl = `/uploads/proofs/${file.filename}`;
    return this.paymentsService.savePaymentProof(poolId, user.id, proofUrl);
  }
}

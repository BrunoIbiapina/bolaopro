import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { PredictionsService } from './predictions.service';
import { SavePredictionsDto } from './dto/save-predictions.dto';

@ApiTags('Predictions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('pools/:poolId/predictions')
export class PredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my predictions for a pool' })
  getMyPredictions(
    @Param('poolId') poolId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.predictionsService.getUserPredictions(poolId, user.id);
  }

  @Get('round/:roundId')
  @ApiOperation({ summary: 'Get my predictions for a specific round' })
  getPredictionsByRound(
    @Param('poolId') poolId: string,
    @Param('roundId') roundId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.predictionsService.getPredictionsByRound(poolId, user.id, roundId);
  }

  @Put('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save predictions in batch' })
  savePredictions(
    @Param('poolId') poolId: string,
    @CurrentUser() user: JwtPayload,
    @Body() saveDto: SavePredictionsDto,
  ) {
    return this.predictionsService.savePredictions(poolId, user.id, saveDto);
  }

  @Delete('cota/:cotaIndex')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar palpites de uma cota (apenas PENDING, partidas abertas)' })
  cancelCotaPredictions(
    @Param('poolId') poolId: string,
    @Param('cotaIndex') cotaIndex: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.predictionsService.cancelCotaPredictions(poolId, user.id, Number(cotaIndex));
  }

  @Get('group')
  @ApiOperation({ summary: 'Palpites do grupo agrupados por partida (somente membros CONFIRMED)' })
  getGroupPredictions(
    @Param('poolId') poolId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.predictionsService.getGroupPredictions(poolId, user.id);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all predictions for a pool (admin)' })
  getAllPredictions(@Param('poolId') poolId: string) {
    return this.predictionsService.getAllPoolPredictions(poolId);
  }
}

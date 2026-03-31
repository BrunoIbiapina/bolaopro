import { Type } from 'class-transformer';
import { IsNumber, IsUUID, IsOptional, Min, ValidateNested, IsArray } from 'class-validator';

export class PredictionItemDto {
  @IsUUID()
  matchId!: string;

  @IsNumber()
  @Min(0)
  homeScore!: number;

  @IsNumber()
  @Min(0)
  awayScore!: number;

  @IsOptional()
  @IsUUID()
  knockoutWinnerId?: string;

  @IsOptional()
  @IsNumber()
  cotaIndex?: number;
}

export class SavePredictionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PredictionItemDto)
  predictions!: PredictionItemDto[];
}

import { Type } from 'class-transformer';
import { IsNumber, IsString, IsNotEmpty, IsOptional, Min, ValidateNested, IsArray } from 'class-validator';

export class PredictionItemDto {
  @IsString()
  @IsNotEmpty()
  matchId!: string;

  @IsNumber()
  @Min(0)
  homeScore!: number;

  @IsNumber()
  @Min(0)
  awayScore!: number;

  @IsOptional()
  @IsString()
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

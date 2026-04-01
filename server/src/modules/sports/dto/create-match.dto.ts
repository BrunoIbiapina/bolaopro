import { IsDate, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  championshipId!: string;

  @IsString()
  @IsNotEmpty()
  homeTeamId!: string;

  @IsString()
  @IsNotEmpty()
  awayTeamId!: string;

  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @IsOptional()
  @IsString()
  roundId?: string;
}

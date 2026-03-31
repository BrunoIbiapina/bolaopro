import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class RegisterMatchResultDto {
  @IsNumber()
  @Min(0)
  homeScore!: number;

  @IsNumber()
  @Min(0)
  awayScore!: number;

  @IsOptional()
  @IsUUID()
  knockoutWinnerId?: string;
}

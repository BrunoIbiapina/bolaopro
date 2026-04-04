import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RegisterMatchResultDto {
  @IsNumber()
  @Min(0)
  homeScore!: number;

  @IsNumber()
  @Min(0)
  awayScore!: number;

  @IsOptional()
  @IsString()
  knockoutWinnerId?: string;
}

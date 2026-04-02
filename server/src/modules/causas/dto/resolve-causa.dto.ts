import { IsOptional, IsString, IsNumber } from 'class-validator';

export class ResolveCausaDto {
  @IsOptional()
  @IsString()
  winningOptionId?: string;

  @IsOptional()
  @IsNumber()
  numericResult?: number;
}

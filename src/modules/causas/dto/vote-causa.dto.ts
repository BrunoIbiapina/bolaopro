import { IsOptional, IsString, IsNumber, IsInt, Min } from 'class-validator';

export class VoteCausaDto {
  @IsOptional()
  @IsString()
  optionId?: string;

  @IsOptional()
  @IsNumber()
  numericValue?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  numCotas?: number;
}

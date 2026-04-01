import { IsString, IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreatePoolDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  championshipId!: string;

  @IsNumber()
  @Min(0)
  entryFee!: number;

  @IsNumber()
  @Min(2)
  maxParticipants!: number;

  @IsOptional()
  @IsString()
  rules?: string;
}

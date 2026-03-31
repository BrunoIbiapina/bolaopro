import { IsString, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';

export class CreatePoolDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
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

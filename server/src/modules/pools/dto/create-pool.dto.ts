import { IsString, IsOptional, IsNumber, IsArray, Min, IsNotEmpty } from 'class-validator';

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
  @IsNumber()
  cotasPerParticipant?: number;

  @IsOptional()
  @IsNumber()
  organizerCotas?: number;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  pixKey?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  matchIds?: string[];
}

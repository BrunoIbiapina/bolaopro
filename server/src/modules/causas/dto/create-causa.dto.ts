import {
  IsString, IsOptional, IsEnum, IsDateString, IsNumber,
  IsInt, IsBoolean, IsArray, ValidateNested, MaxLength,
  Min, Max, IsUrl, ArrayMinSize, ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CausaCategory {
  POLITICA = 'POLITICA',
  ESPORTE = 'ESPORTE',
  CLIMA = 'CLIMA',
  ENTRETENIMENTO = 'ENTRETENIMENTO',
  NEGOCIOS = 'NEGOCIOS',
  CULTURA = 'CULTURA',
  OUTROS = 'OUTROS',
}

export enum CausaType {
  BINARY = 'BINARY',
  CHOICE = 'CHOICE',
  NUMERIC = 'NUMERIC',
}

export enum CausaVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum NumericMatchMode {
  EXACT = 'EXACT',
  CLOSEST = 'CLOSEST',
}

export class CausaOptionDto {
  @IsString()
  @MaxLength(100)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;

  @IsInt()
  @Min(0)
  order!: number;
}

export class CreateCausaDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsEnum(CausaCategory)
  category!: CausaCategory;

  @IsEnum(CausaType)
  type!: CausaType;

  @IsEnum(CausaVisibility)
  visibility!: CausaVisibility;

  @IsDateString()
  deadlineAt!: string;

  @IsOptional()
  @IsDateString()
  resolvesAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  cotasPerParticipant?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxVoters?: number;

  @IsOptional()
  @IsBoolean()
  hideVoteCount?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  numericUnit?: string;

  @IsOptional()
  @IsEnum(NumericMatchMode)
  numericMatchMode?: NumericMatchMode;

  // apenas para CHOICE (2–8 opções)
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => CausaOptionDto)
  options?: CausaOptionDto[];
}

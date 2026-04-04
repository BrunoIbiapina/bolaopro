import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CausaCategory, CausaType } from './create-causa.dto';

export enum CausaStatusFilter {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  RESOLVED = 'RESOLVED',
  ALL = 'ALL',
}

export enum CausaSortBy {
  NEWEST = 'newest',
  DEADLINE = 'deadline',
  POPULAR = 'popular',
}

export class ListCausasDto {
  @IsOptional()
  @IsEnum(CausaCategory)
  category?: CausaCategory;

  @IsOptional()
  @IsEnum(CausaType)
  type?: CausaType;

  @IsOptional()
  @IsEnum(CausaStatusFilter)
  status?: CausaStatusFilter;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CausaSortBy)
  sortBy?: CausaSortBy;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

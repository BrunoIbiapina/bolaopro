import { IsString, IsOptional } from 'class-validator';

export class JoinPoolDto {
  @IsString()
  inviteCode!: string;

  @IsOptional()
  @IsString()
  password?: string;
}

import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  poolId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

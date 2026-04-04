import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  poolId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

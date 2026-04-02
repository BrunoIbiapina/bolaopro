import { IsEmail, IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  fullName!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  pixKey?: string;
}

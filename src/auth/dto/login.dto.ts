import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  id: string;

  @IsString()
  password: string;
}

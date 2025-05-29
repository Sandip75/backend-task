import {
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(12, 20)
  @Matches(/^(?=.*[a-z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'Password must contain lowercase letters, numbers, and special characters',
  })
  password?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[가-힣]{1,10}$/, {
    message: 'Username must be 1–10 Korean characters',
  })
  username?: string;
}

import { IsInt, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @IsInt()
  postId: number;

  @IsString()
  @Length(1, 500)
  content: string;
}

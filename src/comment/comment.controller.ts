import {
  Controller,
  Post,
  Get,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateCommentDto) {
    return this.commentService.create(req.user.id, dto);
  }

  @Get()
  list(
    @Query('postId', ParseIntPipe) postId: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.commentService.list(postId, cursor ? Number(cursor) : undefined);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.commentService.delete(id, req.user.id);
  }
}

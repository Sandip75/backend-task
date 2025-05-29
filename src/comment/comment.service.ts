import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  private prisma = new PrismaClient();

  async create(userId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId: dto.postId,
        authorId: userId,
      },
    });
  }

  async list(postId: number, cursor?: number) {
    const limit = 10;

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });

    const hasNext = comments.length > limit;
    const result = hasNext ? comments.slice(0, -1) : comments;

    return {
      nextCursor: hasNext ? result[result.length - 1].id : null,
      comments: result.map((c) => ({
        id: c.id,
        content: c.content,
        username: c.author.username,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  async delete(commentId: number, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const post = await this.prisma.post.findUnique({
      where: { id: comment.postId },
    });

    if (comment.authorId !== userId && post?.authorId !== userId) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { message: 'Comment deleted successfully' };
  }
}

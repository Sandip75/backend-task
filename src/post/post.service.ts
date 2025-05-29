import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  private prisma = new PrismaClient();

  async createPost(userId: string, dto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorId: userId,
      },
    });

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt.toISOString(),
    };
  }

  async listPosts(page = 1) {
    const limit = 20;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      }),
      this.prisma.post.count(),
    ]);

    return {
      total,
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        username: post.author?.username ?? null,
        createdAt: post.createdAt.toISOString(),
      })),
    };
  }

  async getPostDetail(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      username: post.author?.username ?? null,
      createdAt: post.createdAt.toISOString(),
    };
  }
}

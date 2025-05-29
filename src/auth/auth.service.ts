import { Injectable, BadRequestException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private prisma = new PrismaClient();

    async signup(dto: SignupDto) {
        const existing = await this.prisma.member.findUnique({
            where: { id: dto.id },
        });

        if (existing) {
            throw new BadRequestException('Email already registered');
        }
console.log('Received password:', dto.password);

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.member.create({
            data: {
                id: dto.id,
                username: dto.username,
                password: hashedPassword,
            },
        });

        return {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt.toISOString(),
        };
    }
}

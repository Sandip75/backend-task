import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    private prisma = new PrismaClient();
    constructor(private readonly jwtService: JwtService) { }

    async signup(dto: SignupDto) {
        const existing = await this.prisma.member.findUnique({
            where: { id: dto.id },
        });

        if (existing) {
            throw new BadRequestException('Email already registered');
        }

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

    async login(dto: LoginDto) {
        const user = await this.prisma.member.findUnique({
            where: { id: dto.id },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = { sub: user.id };
        const token = await this.jwtService.signAsync(payload);

        return { access_token: token };
    }
}

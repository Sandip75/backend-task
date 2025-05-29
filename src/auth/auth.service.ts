import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { PrismaClient } from '@prisma/client';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';

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

    async login(dto: LoginDto, ip: string) {
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
        await this.prisma.loginRecord.create({
            data: {
                userId: user.id,
                ip,
                loginTime: new Date(),
            },
        });

        const payload = { sub: user.id };
        const token = await this.jwtService.signAsync(payload);

        return { access_token: token };
    }

    async updateUser(user: { id: string }, dto: UpdateUserDto) {
        const updates: any = {};

        if (dto.username) {
            updates.username = dto.username;
        }

        if (dto.password) {
            updates.password = await bcrypt.hash(dto.password, 10);
        }

        if (Object.keys(updates).length === 0) {
            throw new BadRequestException('No fields provided for update.');
        }

        const updated = await this.prisma.member.update({
            where: { id: user.id },
            data: updates,
        });

        return {
            id: updated.id,
            username: updated.username,
            updatedAt: new Date().toISOString(),
        };
    }

    async getLoginRecords(userId: string) {
        const records = await this.prisma.loginRecord.findMany({
            where: { userId },
            orderBy: { loginTime: 'desc' },
            take: 30,
            include: { user: true },
        });

        return records.map((record) => ({
            ip: record.ip,
            loginTime: format(record.loginTime, 'yyyy-MM-dd HH:mm:ss'),
            username: record.user?.username ?? null,
        }));
    }

    async getWeeklyLoginRankings() {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); 

        const activeUsers = await this.prisma.member.findMany({
            select: { id: true, username: true },
        });

        const activeUserIds = activeUsers.map((u) => u.id);
        const userMap = new Map(activeUsers.map((u) => [u.id, u.username]));

        const records = await this.prisma.loginRecord.groupBy({
            by: ['userId'],
            where: {
                userId: { in: activeUserIds },
                loginTime: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
            _count: { userId: true },
            orderBy: {
                _count: { userId: 'desc' },
            },
        });

        if (records.length === 0) {
            return Array(20).fill({
                username: null,
                loginCount: null,
                rank: null,
            });
        }

        const rankings = [];
        let lastCount: number | null = null;
        let currentRank = 0;
        let tieCount = 0;

        for (let i = 0; i < Math.min(20, records.length); i++) {
            const record = records[i];
            const loginCount = record._count.userId;

            if (loginCount !== lastCount) {
                currentRank = currentRank + 1 + tieCount;
                tieCount = 0;
            } else {
                tieCount++;
            }

            lastCount = loginCount;

            rankings.push({
                username: userMap.get(record.userId)!,
                loginCount,
                rank: currentRank,
            });
        }

        while (rankings.length < 20) {
            rankings.push({ username: null, loginCount: null, rank: null });
        }

        return rankings;
    }

}

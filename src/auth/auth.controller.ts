import { Body, Controller, Post, BadRequestException, UseGuards, Patch, Request, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    async signup(@Body() dto: SignupDto) {
        return this.authService.signup(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto, @Req() req: Request) {
        const ip = req.headers['x-forwarded-for'] || 'unknown';
        return this.authService.login(dto, ip);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('update')
    update(@Request() req, @Body() dto: UpdateUserDto) {
        return this.authService.updateUser(req.user, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('login-records')
    getLoginRecords(@Request() req) {
        return this.authService.getLoginRecords(req.user.id);
    }
}

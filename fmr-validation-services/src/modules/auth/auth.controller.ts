import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginDto } from './auth.service';
import { JwtAuthGuard, Public } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @Public()
  login(@Body() payload: LoginDto) {
    console.log('AuthController received payload:', JSON.stringify(payload));
    return this.authService.login(payload);
  }

  @Post('refresh')
  @Public()
  refresh(@Body('refreshToken') refreshToken?: string) {
    return this.authService.refresh(refreshToken ?? '');
  }

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  profile(@Param('id') id: string) {
    return this.authService.getProfile(id);
  }
}

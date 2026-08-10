import { Controller, Post, Get, Body, HttpCode, HttpStatus, Req, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, UserPayload } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('config')
  getPublicConfig() {
    return this.authService.getPublicConfig();
  }

  @Public()
  @Post('signup')
  signup(@Body() signupDto: SignupDto, @Req() req: any) {
    const tenantUid = req.tenantUid || null;
    if (!tenantUid) {
      throw new ForbiddenException('Signups must be performed within a tenant workspace');
    }
    return this.authService.signup(signupDto, tenantUid);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto, @Req() req: any) {
    const tenantUid = req.tenantUid || null;
    return this.authService.login(loginDto, tenantUid);
  }

  @Get('me')
  async getProfile(@CurrentUser() user: UserPayload) {
    return this.authService.getFreshProfile(user.userUid);
  }
}

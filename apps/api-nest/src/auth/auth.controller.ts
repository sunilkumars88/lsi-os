import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/guards/public.decorator';
import { RequestWithUser } from '../common/types/request-with-user';
import { User } from '../database/entities/user.entity';
import { AuthService } from './auth.service';
import {
  LoginDto,
  MagicLinkRequestDto,
  MagicLinkVerifyDto,
  PasswordResetDto,
  PasswordResetRequestDto,
  RefreshDto,
  RegisterDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: User, @Body('refreshToken') refreshToken?: string) {
    return this.auth.logout(user.id, refreshToken);
  }

  @Public()
  @Post('magic-link/request')
  requestMagicLink(@Body() dto: MagicLinkRequestDto) {
    return this.auth.requestMagicLink(dto);
  }

  @Public()
  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  verifyMagicLink(@Body() dto: MagicLinkVerifyDto) {
    return this.auth.verifyMagicLink(dto);
  }

  @Public()
  @Post('password-reset/request')
  requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.auth.requestPasswordReset(dto);
  }

  @Public()
  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: PasswordResetDto) {
    return this.auth.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.auth.me(user);
  }

  @Public()
  @Get('oauth/google')
  googleOAuth() {
    const clientId = this.config.get<string>('app.googleClientId');
    if (!clientId) {
      throw new NotImplementedException('Google OAuth is not configured');
    }
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}` };
  }

  @Public()
  @Get('oauth/microsoft')
  microsoftOAuth() {
    const clientId = this.config.get<string>('app.microsoftClientId');
    if (!clientId) {
      throw new NotImplementedException('Microsoft OAuth is not configured');
    }
    return {
      url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}`,
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  RegisterInput,
  LoginInput,
} from '@subguard/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserProfile } from '@subguard/types';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() body: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.register(body, ip, userAgent);

    this.setSessionCookie(res, result.sessionToken);
    return { user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(body, ip, userAgent);

    this.setSessionCookie(res, result.sessionToken);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request & { sessionId?: string },
    @CurrentUser() user: UserProfile,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.authService.logout(req.sessionId || '', user.id);
    this.clearSessionCookie(res);
    return { success: true };
  }

  @Get('session')
  getSession(@CurrentUser() user: UserProfile) {
    return { user };
  }

  private setSessionCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('subguard_session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  private clearSessionCookie(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('subguard_session', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token =
      request.cookies?.['subguard_session'] ||
      this.extractBearerToken(request.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException('Authentication session required');
    }

    const sessionTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const session = await this.prisma.session.findUnique({
      where: { sessionTokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            currency: true,
            timezone: true,
            onboardingCompleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (session.revokedAt || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session has expired or been revoked');
    }

    // Attach user profile to request context
    request.user = {
      ...session.user,
      createdAt: session.user.createdAt.toISOString(),
      updatedAt: session.user.updatedAt.toISOString(),
    };
    request.sessionId = session.id;

    return true;
  }

  private extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7).trim();
  }
}

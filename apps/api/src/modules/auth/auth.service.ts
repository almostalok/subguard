import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterInput, LoginInput } from '@subguard/validation';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name || null,
        currency: input.currency || 'INR',
        timezone: input.timezone || 'Asia/Kolkata',
      },
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
    });

    // Record audit event
    await this.prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: 'AUTH_REGISTER',
        entityType: 'User',
        entityId: user.id,
      },
    });

    const session = await this.createSession(user.id, ipAddress, userAgent);

    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      sessionToken: session.token,
    };
  }

  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const session = await this.createSession(user.id, ipAddress, userAgent);

    await this.prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: 'AUTH_LOGIN_SUCCESS',
        entityType: 'Session',
        entityId: session.id,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency,
        timezone: user.timezone,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      sessionToken: session.token,
    };
  }

  async logout(sessionId: string, userId: string) {
    if (sessionId) {
      await this.prisma.session.updateMany({
        where: { id: sessionId, userId },
        data: { revokedAt: new Date() },
      });
    }

    await this.prisma.auditEvent.create({
      data: {
        userId,
        action: 'AUTH_LOGOUT',
        entityType: 'Session',
        entityId: sessionId,
      },
    });

    return { success: true };
  }

  private async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Generate 256-bit cryptographically random token
    const token = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 30 days session expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await this.prisma.session.create({
      data: {
        userId,
        sessionTokenHash,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
      },
    });

    return { id: session.id, token };
  }
}

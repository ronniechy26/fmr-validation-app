import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { users } from '../../data/users';

export interface LoginDto {
  email: string;
  password: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshExpiresIn: number;
  user: SessionUser;
}

@Injectable()
export class AuthService {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessTtlSeconds = this.config.get<number>(
      'JWT_EXPIRES_IN_SECONDS',
      60 * 60,
    );
    this.refreshTtlSeconds = this.config.get<number>(
      'JWT_REFRESH_EXPIRES_IN_SECONDS',
      60 * 60 * 24,
    );
    this.accessSecret = this.config.get<string>('JWT_SECRET', 'dev-secret');
    this.refreshSecret = this.config.get<string>(
      'JWT_REFRESH_SECRET',
      this.accessSecret,
    );
  }

  login(payload: LoginDto): LoginResponse {
    const user = this.validateCredentials(payload);
    return this.issueTokens(user);
  }

  refresh(refreshToken: string): LoginResponse {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    let decoded: { sub: string };
    try {
      decoded = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = this.getProfile(decoded.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.issueTokens(user);
  }

  getProfile(userId: string): SessionUser | undefined {
    const user = users.find((item) => item.id === userId);
    if (!user) return undefined;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      region: user.region,
    };
  }

  private validateCredentials(payload: LoginDto): SessionUser {
    const user = users.find(
      (item) =>
        item.email === payload.email && item.password === payload.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      region: user.region,
    };
  }

  private issueTokens(user: SessionUser): LoginResponse {
    const basePayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      region: user.region,
    };
    const accessToken = this.jwtService.sign(basePayload, {
      secret: this.accessSecret,
      expiresIn: `${this.accessTtlSeconds}s`,
    });
    const refreshToken = this.jwtService.sign(basePayload, {
      secret: this.refreshSecret,
      expiresIn: `${this.refreshTtlSeconds}s`,
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTtlSeconds,
      refreshExpiresIn: this.refreshTtlSeconds,
      user,
    };
  }
}

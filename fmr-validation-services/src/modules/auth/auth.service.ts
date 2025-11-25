import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { users } from '../../data/users';

export interface LoginDto {
  username: string;
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

interface AbemisLoginResponse {
  success: boolean;
  user: {
    id: number;
    username: string;
    email: string;
    fullname: string;
    region: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly abemisBaseUrl: string;

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
    this.abemisBaseUrl = this.config.get<string>(
      'ABEMIS_BASE_URL',
      'https://abemis.staging.bafe.gov.ph',
    );
  }

  async login(payload: LoginDto): Promise<LoginResponse> {
    // Try ABEMIS authentication first
    try {
      const abemisUser = await this.authenticateWithAbemis(payload);
      if (abemisUser) {
        this.logger.log(`User authenticated via ABEMIS: ${abemisUser.email}`);
        return this.issueTokens(abemisUser);
      }
    } catch (error) {
      this.logger.warn(
        `ABEMIS authentication failed: ${error.message}. Falling back to local users.`,
      );
    }

    // Fallback to hardcoded users for testing
    const user = this.validateLocalCredentials(payload);
    this.logger.log(`User authenticated via local database: ${user.email}`);
    return this.issueTokens(user);
  }

  private async authenticateWithAbemis(
    payload: LoginDto,
  ): Promise<SessionUser | null> {
    try {
      const response = await fetch(`${this.abemisBaseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: payload.username,
          password: payload.password,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data: AbemisLoginResponse = await response.json();

      if (!data.success || !data.user) {
        return null;
      }

      // Map ABEMIS user to SessionUser
      const role = this.determineRole(data.user.region);

      return {
        id: `abemis-${data.user.id}`,
        name: data.user.fullname,
        email: data.user.email,
        role,
        region: data.user.region,
      };
    } catch (error) {
      this.logger.error(`ABEMIS API error: ${error.message}`);
      return null;
    }
  }

  private determineRole(region: string): string {
    // BAFE Central Office users can see all regions (Admin role)
    if (region === 'BAFE - Central Office') {
      return 'Administrator';
    }
    // Other users can only see their own region (Regional role)
    return 'Regional User';
  }

  private validateLocalCredentials(payload: LoginDto): SessionUser {
    // Try to find user by username or email
    const user = users.find(
      (item) =>
        (item.email === payload.username || item.name === payload.username) &&
        item.password === payload.password,
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

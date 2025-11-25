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
    this.logger.log(`Login attempt for username: ${payload.username}`);

    let abemisError: string | null = null;

    // Try ABEMIS authentication first
    try {
      this.logger.log('Attempting ABEMIS authentication...');
      const abemisUser = await this.authenticateWithAbemis(payload);
      if (abemisUser) {
        this.logger.log(`✓ User authenticated via ABEMIS: ${abemisUser.email}`);
        return this.issueTokens(abemisUser);
      }
    } catch (error) {
      abemisError = error.message;
      this.logger.warn(
        `✗ ABEMIS authentication failed: ${error.message}. Falling back to local users.`,
      );
    }

    // Fallback to hardcoded users for testing
    this.logger.log('Attempting local user authentication...');
    try {
      const user = this.validateLocalCredentials(payload);
      this.logger.log(`✓ User authenticated via local database: ${user.email}`);
      return this.issueTokens(user);
    } catch (localError) {
      // If we had an ABEMIS error and local also failed, prefer the ABEMIS error
      // unless the local error is different (but local only throws Invalid credentials)
      if (abemisError) {
        throw new UnauthorizedException(abemisError);
      }
      throw localError;
    }
  }

  private async authenticateWithAbemis(
    payload: LoginDto,
  ): Promise<SessionUser> {
    const abemisUrl = `${this.abemisBaseUrl}/api/login`;
    this.logger.log(`Calling ABEMIS API: ${abemisUrl}`);
    this.logger.debug(`Request payload: ${JSON.stringify({ username: payload.username, password: '***' })}`);

    try {
      const response = await fetch(abemisUrl, {
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

      this.logger.log(`ABEMIS API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) errorMessage = errorJson.message;
        } catch (e) {
          // ignore json parse error
        }
        this.logger.warn(`ABEMIS API returned ${response.status}: ${errorMessage}`);
        throw new UnauthorizedException(errorMessage);
      }

      const data: AbemisLoginResponse = await response.json();
      this.logger.log(`ABEMIS API response: ${JSON.stringify({ success: data.success, hasUser: !!data.user })}`);

      if (!data.success || !data.user) {
        this.logger.warn('ABEMIS response missing success flag or user data');
        throw new UnauthorizedException('Invalid response from ABEMIS');
      }

      // Map ABEMIS user to SessionUser
      const role = this.determineRole(data.user.region);

      this.logger.log(`Mapped ABEMIS user: ${data.user.fullname} (${data.user.email}) - Role: ${role}`);

      return {
        id: `abemis-${data.user.id}`,
        name: data.user.fullname,
        email: data.user.email,
        role,
        region: data.user.region,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`ABEMIS API error: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new UnauthorizedException(`ABEMIS Error: ${error.message}`);
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

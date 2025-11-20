import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const config = new ConfigService({
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN_SECONDS: 60,
      JWT_REFRESH_EXPIRES_IN_SECONDS: 120,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: ConfigService,
          useValue: config,
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('issues access and refresh tokens on login', () => {
    const result = authService.login({
      email: 'mark.baldeo@da.gov.ph',
      password: 'validation123',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.expiresIn).toBeGreaterThan(0);
    expect(result.refreshExpiresIn).toBeGreaterThan(result.expiresIn);
    expect(result.user.email).toBe('mark.baldeo@da.gov.ph');
  });

  it('refreshes tokens when presented a valid refresh token', () => {
    const login = authService.login({
      email: 'alyssa.cruz@da.gov.ph',
      password: 'securepass456',
    });

    const refreshed = authService.refresh(login.refreshToken);
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.refreshToken).toBeDefined();
    expect(refreshed.user.email).toBe(login.user.email);
  });

  it('throws when refresh token is invalid', () => {
    expect(() => authService.refresh('invalid-token')).toThrow();
  });
});

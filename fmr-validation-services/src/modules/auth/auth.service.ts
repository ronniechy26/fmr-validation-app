import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  tokenType: 'Bearer';
  expiresIn: number;
  user: SessionUser;
}

@Injectable()
export class AuthService {
  login(payload: LoginDto): LoginResponse {
    const user = users.find((item) => item.email === payload.email && item.password === payload.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = randomUUID();
    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 60 * 60,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        region: user.region,
      },
    };
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
}

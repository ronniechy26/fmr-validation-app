export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: SessionUser;
};

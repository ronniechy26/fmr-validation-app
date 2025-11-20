export type StoredSession<User = unknown> = {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
  refreshExpiresAt: number;
};

export type StoredSession<User = unknown> = {
  token: string;
  user: User;
  expiresAt: number;
};

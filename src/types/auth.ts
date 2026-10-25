export type UserRole = 'admin' | 'treasurer' | 'editor' | 'viewer';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

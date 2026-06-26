import { post, get } from './api';
import { LoginResponse, User, Company } from '@shared/types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await post<LoginResponse>('/auth/login', { email, password });
  localStorage.setItem('c-lol-token', data.token);
  localStorage.setItem('c-lol-user', JSON.stringify(data.user));
  return data;
}

export function logout(): void {
  localStorage.removeItem('c-lol-token');
  localStorage.removeItem('c-lol-user');
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('c-lol-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('c-lol-token');
}

export async function getMe(): Promise<{ user: User; company: Company }> {
  return get<{ user: User; company: Company }>('/auth/me');
}

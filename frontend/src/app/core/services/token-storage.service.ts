import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { AuthUser } from '../models/user.model';

/**
 * Thin, single-responsibility wrapper around persistent token/user storage.
 * Keeping localStorage access here makes the auth flow easy to test and swap.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  setSession(accessToken: string, refreshToken: string, user: AuthUser): void {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
  }
}

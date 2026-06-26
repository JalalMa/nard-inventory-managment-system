import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from '../enums/user-role.enum';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { AuthUser } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  /** Reactive auth state exposed to the app via signals. */
  private readonly currentUserSignal = signal<AuthUser | null>(this.storage.getUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isManager = computed(() => this.currentUserSignal()?.role === UserRole.MANAGER);

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(tap((res) => this.persist(res)));
  }

  private refreshInFlight$?: Observable<AuthResponse>;

  /**
   * Exchanges the refresh token for a new pair. The refresh token is sent as a
   * bearer token (the backend's refresh strategy reads it from there). The
   * in-flight request is memoized so concurrent 401s trigger a single refresh.
   */
  refresh(): Observable<AuthResponse> {
    if (!this.refreshInFlight$) {
      const refreshToken = this.storage.getRefreshToken();
      this.refreshInFlight$ = this.http
        .post<AuthResponse>(
          `${this.baseUrl}/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken ?? ''}` } },
        )
        .pipe(
          tap((res) => this.persist(res)),
          finalize(() => (this.refreshInFlight$ = undefined)),
          shareReplay(1),
        );
    }
    return this.refreshInFlight$;
  }

  logout(): void {
    // Best-effort server-side invalidation; local state is cleared regardless.
    this.http.post(`${this.baseUrl}/logout`, {}).subscribe({ error: () => undefined });
    this.clearSession();
  }

  clearSession(): void {
    this.storage.clear();
    this.currentUserSignal.set(null);
  }

  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }

  hasRole(role: UserRole): boolean {
    return this.currentUserSignal()?.role === role;
  }

  private persist(res: AuthResponse): void {
    this.storage.setSession(res.accessToken, res.refreshToken, res.user);
    this.currentUserSignal.set(res.user);
  }
}

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const runGuard = () =>
    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

  const configure = (isAuthenticated: boolean) => {
    const parseUrl = jasmine.createSpy('parseUrl').and.returnValue({} as UrlTree);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } },
        { provide: Router, useValue: { parseUrl } },
      ],
    });
    return parseUrl;
  };

  it('allows activation when authenticated', () => {
    configure(true);
    expect(runGuard()).toBe(true);
  });

  it('redirects to login when not authenticated', () => {
    const parseUrl = configure(false);
    const result = runGuard();
    expect(parseUrl).toHaveBeenCalledWith('/auth/login');
    expect(result).not.toBe(true);
  });
});

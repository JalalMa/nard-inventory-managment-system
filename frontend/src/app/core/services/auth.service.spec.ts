import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { UserRole } from '../enums/user-role.enum';
import { AuthResponse } from '../models/auth.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const managerResponse: AuthResponse = {
    user: { id: 1, email: 'manager@nard.io', role: UserRole.MANAGER },
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts unauthenticated with no stored session', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('persists session and exposes the user after login', () => {
    service.login({ email: 'manager@nard.io', password: 'Manager123!' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(managerResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isManager()).toBe(true);
    expect(service.getAccessToken()).toBe('access-1');
    expect(service.currentUser()?.email).toBe('manager@nard.io');
  });

  it('clears the session on logout', () => {
    service.login({ email: 'manager@nard.io', password: 'x' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(managerResponse);

    service.logout();
    httpMock.expectOne(`${environment.apiUrl}/auth/logout`).flush({});

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
  });

  it('sends the refresh token as a bearer header', () => {
    service.login({ email: 'manager@nard.io', password: 'x' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(managerResponse);

    service.refresh().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer refresh-1');
    req.flush({ ...managerResponse, accessToken: 'access-2' });
    expect(service.getAccessToken()).toBe('access-2');
  });
});

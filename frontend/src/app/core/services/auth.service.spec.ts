import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.unstubAllGlobals();
  });

  it('starts unauthenticated with no stored token', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('stores the token and sets the current user on successful login', () => {
    service.login({ email: 'a@example.com', password: 'secret' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ accessToken: 'abc123', user: { id: '1', email: 'a@example.com', name: 'A' } });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('a@example.com');
    expect(localStorage.getItem('commuteconnect_token')).toBe('abc123');
  });

  it('clears state on logout', () => {
    service.login({ email: 'a@example.com', password: 'secret' }).subscribe();
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ accessToken: 'abc123', user: { id: '1', email: 'a@example.com', name: 'A' } });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('commuteconnect_token')).toBeNull();
  });

  it('bootstrap() does nothing when there is no stored token', async () => {
    await service.bootstrap();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.ready()).toBe(true);
  });

  it('bootstrap() restores the session from /auth/me when a token exists', async () => {
    localStorage.setItem('commuteconnect_token', 'existing-token');

    const bootstrapPromise = service.bootstrap();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush({ id: '1', email: 'a@example.com', name: 'A' });
    await bootstrapPromise;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.ready()).toBe(true);
  });
});

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User } from '../models/user.model';

const TOKEN_KEY = 'commuteconnect_token';

interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _ready = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly ready = this._ready.asReadonly();

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async bootstrap(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      this._ready.set(true);
      return;
    }

    try {
      const user = await firstValueFrom(this.http.get<User>(`${environment.apiUrl}/auth/me`));
      this._currentUser.set(user);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      this._currentUser.set(null);
    } finally {
      this._ready.set(true);
    }
  }

  register(payload: RegisterPayload) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  login(payload: LoginPayload) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._currentUser.set(null);
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    this._currentUser.set(response.user);
  }
}

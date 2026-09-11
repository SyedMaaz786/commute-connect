import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let jwtService: { sign: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    usersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    jwtService = {
      sign: vi.fn().mockReturnValue('signed-token'),
    };
    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('rejects an email that is already taken', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'taken@example.com' });

      await expect(
        authService.register({ email: 'taken@example.com', password: 'Passw0rd1', name: 'Taken' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password before storing the user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation(async (data) => ({ id: '1', ...data }));

      await authService.register({ email: 'new@example.com', password: 'Passw0rd1', name: 'New' });

      const passwordHash = usersService.create.mock.calls[0][0].passwordHash;
      expect(passwordHash).not.toBe('Passw0rd1');
      expect(await bcrypt.compare('Passw0rd1', passwordHash)).toBe(true);
    });

    it('returns an access token and the new user on success', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: '1',
        email: 'new@example.com',
        name: 'New',
      });

      const result = await authService.register({
        email: 'new@example.com',
        password: 'Passw0rd1',
        name: 'New',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user).toEqual({ id: '1', email: 'new@example.com', name: 'New' });
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'missing@example.com', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        name: 'User',
        passwordHash,
      });

      await expect(
        authService.login({ email: 'user@example.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns an access token when the password matches', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        name: 'User',
        passwordHash,
      });

      const result = await authService.login({
        email: 'user@example.com',
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: '1' });
    });
  });
});

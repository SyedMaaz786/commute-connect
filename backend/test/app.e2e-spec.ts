import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter.js';
import { DataSource } from 'typeorm';

describe('CommuteConnect API (e2e)', () => {
  let app: INestApplication;
  const testEmails: string[] = [];

  beforeAll(async () => {
    const database = new URL(
      process.env.DATABASE_URL ?? 'postgresql://localhost/missing',
    );
    if (!database.pathname.endsWith('_test')) {
      throw new Error(
        'E2E tests require a separate database whose name ends in _test. Configure backend/.env.test.',
      );
    }
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();
  });

  afterAll(async () => {
    if (!app) return;
    try {
      await app
        .get(DataSource)
        .query('DELETE FROM users WHERE email = ANY($1)', [testEmails]);
    } finally {
      await app.close();
    }
  });

  const uniqueEmail = (label: string) => {
    const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    testEmails.push(email);
    return email;
  };

  it('lets a user register, log in, and read their own profile', async () => {
    const email = uniqueEmail('owner');

    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Passw0rd1', name: 'Owner' })
      .expect(201);

    expect(registerRes.body.accessToken).toBeDefined();
    expect(registerRes.body.user.email).toBe(email);
    expect(registerRes.body.user.passwordHash).toBeUndefined();

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Passw0rd1' })
      .expect(200);

    const token = loginRes.body.accessToken;

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.email).toBe(email);
  });

  it('runs the full create post -> express interest -> withdraw flow across two users', async () => {
    const ownerEmail = uniqueEmail('owner2');
    const interestedEmail = uniqueEmail('interested');

    const owner = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: ownerEmail, password: 'Passw0rd1', name: 'Owner Two' })
      .expect(201);
    const interested = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: interestedEmail,
        password: 'Passw0rd1',
        name: 'Interested',
      })
      .expect(201);

    const ownerToken = owner.body.accessToken;
    const interestedToken = interested.body.accessToken;

    const departureAt = new Date(Date.now() + 86400000).toISOString();

    const createRes = await request(app.getHttpServer())
      .post('/api/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        type: 'OFFERING',
        origin: 'Downtown',
        destination: 'Airport',
        departureAt,
        seatsAvailable: 2,
      })
      .expect(201);

    const postId = createRes.body.id;

    await request(app.getHttpServer()).get('/api/posts').expect(401);

    await request(app.getHttpServer())
      .post(`/api/posts/${postId}/interest`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/posts/${postId}/interest`)
      .set('Authorization', `Bearer ${interestedToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/posts/${postId}/interest`)
      .set('Authorization', `Bearer ${interestedToken}`)
      .expect(409);

    await request(app.getHttpServer())
      .get(`/api/posts/${postId}/interests`)
      .set('Authorization', `Bearer ${interestedToken}`)
      .expect(403);

    const interestsRes = await request(app.getHttpServer())
      .get(`/api/posts/${postId}/interests`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(interestsRes.body).toHaveLength(1);

    await request(app.getHttpServer())
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${interestedToken}`)
      .send({ seatsAvailable: 1 })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${interestedToken}`)
      .expect(403);

    const updated = await request(app.getHttpServer())
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ seatsAvailable: 3, notes: 'Pickup at Gate 2' })
      .expect(200);
    expect(updated.body.seatsAvailable).toBe(3);

    const mine = await request(app.getHttpServer())
      .get('/api/posts/mine')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(
      mine.body.data.some((post: { id: string }) => post.id === postId),
    ).toBe(true);
    const joined = await request(app.getHttpServer())
      .get('/api/interests/mine')
      .set('Authorization', `Bearer ${interestedToken}`)
      .expect(200);
    expect(
      joined.body.some(
        (interest: { postId: string }) => interest.postId === postId,
      ),
    ).toBe(true);

    const filtered = await request(app.getHttpServer())
      .get('/api/posts?origin=down&destination=air&type=OFFERING&limit=1')
      .set('Authorization', `Bearer ${interestedToken}`)
      .expect(200);
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].origin.toLowerCase()).toContain('down');
    expect(filtered.body.page).toBe(1);

    await request(app.getHttpServer())
      .delete(`/api/posts/${postId}/interest`)
      .set('Authorization', `Bearer ${interestedToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  it('returns real validation messages for a bad registration payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'x', name: '' })
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message.length).toBeGreaterThan(0);
  });
});

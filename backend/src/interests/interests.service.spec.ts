import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InterestsService } from './interests.service.js';
import { PostsService } from '../posts/posts.service.js';
import type { Repository } from 'typeorm';
import type { Interest } from './entities/interest.entity.js';
import { PostType } from '../posts/entities/post-type.enum.js';

describe('InterestsService', () => {
  let interestsService: InterestsService;
  let repository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let postsService: { findOne: ReturnType<typeof vi.fn> };

  const ownerId = 'owner-1';
  const interestedUserId = 'user-2';
  const postId = 'post-1';

  const samplePost = (overrides: Record<string, unknown> = {}) => ({
    id: postId,
    ownerId,
    type: PostType.OFFERING,
    origin: 'Downtown',
    destination: 'Airport',
    ...overrides,
  });

  beforeEach(() => {
    repository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn(async (data) => data),
      remove: vi.fn(async (data) => data),
    };
    postsService = { findOne: vi.fn() };
    interestsService = new InterestsService(
      repository as unknown as Repository<Interest>,
      postsService as unknown as PostsService,
    );
  });

  describe('express', () => {
    it('rejects expressing interest in your own post', async () => {
      postsService.findOne.mockResolvedValue(samplePost());

      await expect(interestsService.express(postId, ownerId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a duplicate interest', async () => {
      postsService.findOne.mockResolvedValue(samplePost());
      repository.findOne.mockResolvedValue({ id: 'existing', postId, userId: interestedUserId });

      await expect(interestsService.express(postId, interestedUserId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('creates the interest when everything checks out', async () => {
      postsService.findOne.mockResolvedValue(samplePost());
      repository.findOne.mockResolvedValue(null);

      const result = await interestsService.express(postId, interestedUserId);

      expect(result).toEqual({ postId, userId: interestedUserId });
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('withdraw', () => {
    it('throws when there is nothing to withdraw', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(interestsService.withdraw(postId, interestedUserId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('removes an existing interest', async () => {
      const interest = { id: 'i1', postId, userId: interestedUserId };
      repository.findOne.mockResolvedValue(interest);

      await interestsService.withdraw(postId, interestedUserId);

      expect(repository.remove).toHaveBeenCalledWith(interest);
    });
  });

  describe('findForPost', () => {
    it('rejects a non-owner from viewing interested users', async () => {
      postsService.findOne.mockResolvedValue(samplePost());

      await expect(
        interestsService.findForPost(postId, interestedUserId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns the interested users for the owner', async () => {
      postsService.findOne.mockResolvedValue(samplePost());
      repository.find.mockResolvedValue([{ id: 'i1', postId, userId: interestedUserId }]);

      const result = await interestsService.findForPost(postId, ownerId);

      expect(result).toHaveLength(1);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { PostType } from './entities/post-type.enum.js';
import type { Repository } from 'typeorm';
import type { CommutePost } from './entities/commute-post.entity.js';

function buildQueryBuilder(result: { data: CommutePost[]; total: number }) {
  const qb: Record<string, ReturnType<typeof vi.fn>> = {
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn().mockResolvedValue([result.data, result.total]),
  };
  return qb;
}

describe('PostsService', () => {
  let postsService: PostsService;
  let repository: {
    createQueryBuilder: ReturnType<typeof vi.fn>;
    findAndCount: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const ownerId = 'owner-1';
  const otherId = 'owner-2';

  const samplePost = (overrides: Partial<CommutePost> = {}): CommutePost =>
    ({
      id: 'post-1',
      ownerId,
      type: PostType.OFFERING,
      origin: 'Downtown',
      destination: 'Airport',
      departureAt: new Date(Date.now() + 86400000),
      seatsAvailable: 3,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as CommutePost;

  beforeEach(() => {
    repository = {
      createQueryBuilder: vi.fn(),
      findAndCount: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn(async (data) => data),
      remove: vi.fn(async (data) => data),
    };
    postsService = new PostsService(repository as unknown as Repository<CommutePost>);
  });

  describe('findAll', () => {
    it('applies origin and destination filters and paginates the result', async () => {
      const post = samplePost();
      const qb = buildQueryBuilder({ data: [post], total: 1 });
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await postsService.findAll({
        page: 2,
        limit: 5,
        origin: 'Down',
        destination: 'Air',
      });

      expect(qb.andWhere).toHaveBeenCalledWith('post.origin ILIKE :origin', { origin: '%Down%' });
      expect(qb.andWhere).toHaveBeenCalledWith('post.destination ILIKE :destination', {
        destination: '%Air%',
      });
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result).toEqual({ data: [post], total: 1, page: 2, limit: 5, totalPages: 1 });
    });
  });

  describe('update', () => {
    it('throws when a non-owner tries to update the post', async () => {
      repository.findOne.mockResolvedValue(samplePost());

      await expect(
        postsService.update('post-1', otherId, { seatsAvailable: 2 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('applies the update when the requester owns the post', async () => {
      repository.findOne.mockResolvedValue(samplePost());

      const result = await postsService.update('post-1', ownerId, { seatsAvailable: 2 });

      expect(result.seatsAvailable).toBe(2);
      expect(repository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException for a post that does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(postsService.update('missing', ownerId, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('throws when a non-owner tries to delete the post', async () => {
      repository.findOne.mockResolvedValue(samplePost());

      await expect(postsService.remove('post-1', otherId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('removes the post when the requester owns it', async () => {
      const post = samplePost();
      repository.findOne.mockResolvedValue(post);

      await postsService.remove('post-1', ownerId);

      expect(repository.remove).toHaveBeenCalledWith(post);
    });
  });
});

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommutePost } from './entities/commute-post.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { QueryPostsDto } from './dto/query-posts.dto.js';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface.js';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(CommutePost)
    private readonly postsRepository: Repository<CommutePost>,
  ) {}

  async findAll(query: QueryPostsDto): Promise<PaginatedResult<CommutePost>> {
    const qb = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.owner', 'owner')
      .orderBy('post.departureAt', 'ASC');

    if (query.origin) {
      qb.andWhere('post.origin ILIKE :origin', { origin: `%${query.origin}%` });
    }
    if (query.destination) {
      qb.andWhere('post.destination ILIKE :destination', {
        destination: `%${query.destination}%`,
      });
    }
    if (query.type) {
      qb.andWhere('post.type = :type', { type: query.type });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findMine(ownerId: string, query: QueryPostsDto): Promise<PaginatedResult<CommutePost>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await this.postsRepository.findAndCount({
      where: { ownerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async findOne(id: string): Promise<CommutePost> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!post) {
      throw new NotFoundException('Commute post not found');
    }
    return post;
  }

  async create(ownerId: string, dto: CreatePostDto): Promise<CommutePost> {
    const post = this.postsRepository.create({
      ...dto,
      departureAt: new Date(dto.departureAt),
      ownerId,
    });
    return this.postsRepository.save(post);
  }

  async update(id: string, ownerId: string, dto: UpdatePostDto): Promise<CommutePost> {
    const post = await this.findOne(id);
    this.assertOwnership(post, ownerId);

    Object.assign(post, {
      ...dto,
      departureAt: dto.departureAt ? new Date(dto.departureAt) : post.departureAt,
    });

    return this.postsRepository.save(post);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const post = await this.findOne(id);
    this.assertOwnership(post, ownerId);
    await this.postsRepository.remove(post);
  }

  private assertOwnership(post: CommutePost, ownerId: string): void {
    if (post.ownerId !== ownerId) {
      throw new ForbiddenException('You can only manage your own posts');
    }
  }
}

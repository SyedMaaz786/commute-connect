import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interest } from './entities/interest.entity.js';
import { PostsService } from '../posts/posts.service.js';

@Injectable()
export class InterestsService {
  constructor(
    @InjectRepository(Interest)
    private readonly interestsRepository: Repository<Interest>,
    private readonly postsService: PostsService,
  ) {}

  async express(postId: string, userId: string): Promise<Interest> {
    const post = await this.postsService.findOne(postId);

    if (post.ownerId === userId) {
      throw new BadRequestException('You cannot express interest in your own post');
    }

    const existing = await this.interestsRepository.findOne({ where: { postId, userId } });
    if (existing) {
      throw new ConflictException('You have already expressed interest in this post');
    }

    const interest = this.interestsRepository.create({ postId, userId });
    return this.interestsRepository.save(interest);
  }

  async withdraw(postId: string, userId: string): Promise<void> {
    const interest = await this.interestsRepository.findOne({ where: { postId, userId } });
    if (!interest) {
      throw new NotFoundException("You haven't expressed interest in this post");
    }
    await this.interestsRepository.remove(interest);
  }

  async findForPost(postId: string, requesterId: string): Promise<Interest[]> {
    const post = await this.postsService.findOne(postId);
    if (post.ownerId !== requesterId) {
      throw new ForbiddenException('Only the post owner can see who is interested');
    }

    return this.interestsRepository.find({
      where: { postId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  findMine(userId: string): Promise<Interest[]> {
    return this.interestsRepository.find({
      where: { userId },
      relations: { post: { owner: true } },
      order: { createdAt: 'DESC' },
    });
  }
}

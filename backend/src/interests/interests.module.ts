import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interest } from './entities/interest.entity.js';
import { InterestsService } from './interests.service.js';
import { InterestsController, MyInterestsController } from './interests.controller.js';
import { PostsModule } from '../posts/posts.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Interest]), PostsModule, AuthModule],
  controllers: [InterestsController, MyInterestsController],
  providers: [InterestsService],
})
export class InterestsModule {}

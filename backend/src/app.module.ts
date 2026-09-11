import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { InterestsModule } from './interests/interests.module.js';
import { User } from './users/entities/user.entity.js';
import { CommutePost } from './posts/entities/commute-post.entity.js';
import { Interest } from './interests/entities/interest.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [User, CommutePost, Interest],
        synchronize: false,
        autoLoadEntities: false,
      }),
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    InterestsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

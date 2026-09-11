import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InterestsService } from './interests.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface.js';

@Controller('posts/:postId')
@UseGuards(JwtAuthGuard)
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Post('interest')
  @HttpCode(HttpStatus.CREATED)
  express(@Param('postId', ParseUUIDPipe) postId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.interestsService.express(postId, user.id);
  }

  @Delete('interest')
  @HttpCode(HttpStatus.NO_CONTENT)
  withdraw(@Param('postId', ParseUUIDPipe) postId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.interestsService.withdraw(postId, user.id);
  }

  @Get('interests')
  findForPost(@Param('postId', ParseUUIDPipe) postId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.interestsService.findForPost(postId, user.id);
  }
}

@Controller('interests')
@UseGuards(JwtAuthGuard)
export class MyInterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.interestsService.findMine(user.id);
  }
}

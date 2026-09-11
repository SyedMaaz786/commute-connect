import type { User } from './user.model';
import type { CommutePost } from './post.model';

export interface Interest {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  post?: CommutePost;
  createdAt: string;
}

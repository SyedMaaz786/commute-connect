import type { User } from './user.model';

export type PostType = 'OFFERING' | 'LOOKING';

export interface CommutePost {
  id: string;
  ownerId: string;
  owner?: User;
  type: PostType;
  origin: string;
  destination: string;
  departureAt: string;
  seatsAvailable: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostPayload {
  type: PostType;
  origin: string;
  destination: string;
  departureAt: string;
  seatsAvailable: number;
  notes?: string;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;

export interface PostsQuery {
  page?: number;
  limit?: number;
  origin?: string;
  destination?: string;
  type?: PostType;
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { Paginated } from '../models/paginated.model';
import type { CommutePost, CreatePostPayload, PostsQuery, UpdatePostPayload } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/posts`;

  list(query: PostsQuery) {
    return this.http.get<Paginated<CommutePost>>(this.baseUrl, { params: this.buildParams(query) });
  }

  listMine(query: PostsQuery) {
    return this.http.get<Paginated<CommutePost>>(`${this.baseUrl}/mine`, {
      params: this.buildParams(query),
    });
  }

  getOne(id: string) {
    return this.http.get<CommutePost>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreatePostPayload) {
    return this.http.post<CommutePost>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdatePostPayload) {
    return this.http.patch<CommutePost>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private buildParams(query: PostsQuery): HttpParams {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.origin) params = params.set('origin', query.origin);
    if (query.destination) params = params.set('destination', query.destination);
    if (query.type) params = params.set('type', query.type);
    return params;
  }
}

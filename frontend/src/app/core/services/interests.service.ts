import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { Interest } from '../models/interest.model';

@Injectable({ providedIn: 'root' })
export class InterestsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  express(postId: string) {
    return this.http.post<Interest>(`${this.baseUrl}/posts/${postId}/interest`, {});
  }

  withdraw(postId: string) {
    return this.http.delete<void>(`${this.baseUrl}/posts/${postId}/interest`);
  }

  listForPost(postId: string) {
    return this.http.get<Interest[]>(`${this.baseUrl}/posts/${postId}/interests`);
  }

  listMine() {
    return this.http.get<Interest[]>(`${this.baseUrl}/interests/mine`);
  }
}

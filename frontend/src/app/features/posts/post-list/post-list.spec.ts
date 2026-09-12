import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PostList } from './post-list';
import { environment } from '../../../../environments/environment';

describe('PostList request ordering', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PostList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('cancels older searches and only displays the newest response', () => {
    const fixture = TestBed.createComponent(PostList);
    const page = fixture.componentInstance;
    const initial = http.expectOne((req) => req.url === `${environment.apiUrl}/posts`);
    page.onFiltersChange({ origin: 'Ind' });
    expect(initial.cancelled).toBe(true);
    const older = http.expectOne((req) => req.params.get('origin') === 'Ind');
    page.onFiltersChange({ origin: 'HSR' });
    expect(older.cancelled).toBe(true);
    http
      .expectOne((req) => req.params.get('origin') === 'HSR')
      .flush({ data: [{ id: 'new', origin: 'HSR Layout' }], page: 1, total: 1, totalPages: 1 });
    expect(page.posts()[0].origin).toBe('HSR Layout');
    expect(page.total()).toBe(1);
    expect(page.loading()).toBe(false);
    expect(page.error()).toBeNull();
  });

  it('retries the current filters after an error and cancels work when the page closes', () => {
    const fixture = TestBed.createComponent(PostList);
    const page = fixture.componentInstance;
    http
      .expectOne((req) => req.url.endsWith('/posts'))
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(page.error()).toBeTruthy();
    page.onFiltersChange({ destination: 'Whitefield' });
    http
      .expectOne((req) => req.params.get('destination') === 'Whitefield')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    page.retry();
    const retry = http.expectOne((req) => req.params.get('destination') === 'Whitefield');
    fixture.destroy();
    expect(retry.cancelled).toBe(true);
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { PostDetail } from './post-detail';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const post = {
  id: 'ride-1',
  ownerId: 'owner',
  owner: { id: 'owner', name: 'Owner', email: 'owner@example.com' },
  origin: 'Indiranagar',
  destination: 'Whitefield',
  type: 'OFFERING',
  seatsAvailable: 2,
  departureAt: new Date(Date.now() + 86400000).toISOString(),
};

describe('PostDetail interest recovery', () => {
  let http: HttpTestingController;
  const currentUser = signal({ id: 'owner', name: 'Owner', email: 'owner@example.com' });
  beforeEach(() => {
    currentUser.set({ id: 'owner', name: 'Owner', email: 'owner@example.com' });
    TestBed.configureTestingModule({
      imports: [PostDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: post.id }) } },
        },
        { provide: AuthService, useValue: { currentUser } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('keeps the route visible, reports a failed rider request, and recovers on retry', () => {
    const fixture = TestBed.createComponent(PostDetail);
    http.expectOne(`${environment.apiUrl}/posts/${post.id}`).flush(post);
    http
      .expectOne(`${environment.apiUrl}/posts/${post.id}/interests`)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Indiranagar');
    expect(element.textContent).toContain('Could not load interested riders');
    expect(element.textContent).not.toContain('No one has expressed interest yet');
    expect(element.textContent).not.toContain('(0)');
    fixture.componentInstance.retryInterests();
    http
      .expectOne(`${environment.apiUrl}/posts/${post.id}/interests`)
      .flush([
        { id: 'interest-1', postId: post.id, user: { name: 'Riya', email: 'riya@example.com' } },
      ]);
    fixture.detectChanges();
    expect(element.textContent).toContain('Riya');
    expect(fixture.componentInstance.interestError()).toBeNull();
  });

  it('does not offer a duplicate-interest action while the rider status is unknown', () => {
    currentUser.set({ id: 'rider', name: 'Rider', email: 'rider@example.com' });
    const fixture = TestBed.createComponent(PostDetail);
    http.expectOne(`${environment.apiUrl}/posts/${post.id}`).flush(post);
    http
      .expectOne(`${environment.apiUrl}/interests/mine`)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Could not check your interest',
    );
    fixture.componentInstance.toggleInterest();
    http.expectNone(`${environment.apiUrl}/posts/${post.id}/interest`);
    fixture.componentInstance.retryInterests();
    http.expectOne(`${environment.apiUrl}/interests/mine`).flush([{ postId: post.id }]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Withdraw interest');
  });
});

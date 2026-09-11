import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { PostCard } from './post-card';
import type { CommutePost } from '../../../core/models/post.model';

const samplePost: CommutePost = {
  id: 'post-1',
  ownerId: 'owner-1',
  owner: { id: 'owner-1', email: 'owner@example.com', name: 'Owner Name' },
  type: 'OFFERING',
  origin: 'Downtown',
  destination: 'Airport',
  departureAt: new Date(Date.now() + 86400000).toISOString(),
  seatsAvailable: 2,
  notes: 'Small car',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('PostCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PostCard],
      providers: [provideRouter([])],
    });
  });

  it('renders the route, owner, and seat count', () => {
    const fixture = TestBed.createComponent(PostCard);
    fixture.componentRef.setInput('post', samplePost);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Downtown');
    expect(text).toContain('Airport');
    expect(text).toContain('Owner Name');
    expect(text).toContain('2 seats');
  });

  it('labels a LOOKING post correctly', () => {
    const fixture = TestBed.createComponent(PostCard);
    fixture.componentRef.setInput('post', { ...samplePost, type: 'LOOKING' });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Looking for a ride');
  });
});

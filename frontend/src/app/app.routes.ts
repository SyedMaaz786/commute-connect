import type { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'posts' },
      {
        path: 'posts',
        loadComponent: () => import('./features/posts/post-list/post-list').then((m) => m.PostList),
      },
      {
        path: 'posts/new',
        loadComponent: () => import('./features/posts/post-form/post-form').then((m) => m.PostForm),
      },
      {
        path: 'posts/:id/edit',
        loadComponent: () => import('./features/posts/post-form/post-form').then((m) => m.PostForm),
      },
      {
        path: 'posts/:id',
        loadComponent: () => import('./features/posts/post-detail/post-detail').then((m) => m.PostDetail),
      },
      {
        path: 'dashboard/my-posts',
        loadComponent: () => import('./features/dashboard/my-posts/my-posts').then((m) => m.MyPosts),
      },
      {
        path: 'dashboard/my-interests',
        loadComponent: () =>
          import('./features/dashboard/my-interests/my-interests').then((m) => m.MyInterests),
      },
    ],
  },
  { path: '**', redirectTo: 'posts' },
];

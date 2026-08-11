import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'codes',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./layouts/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPageComponent),
      },
    ],
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./layouts/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPageComponent),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'codes',
        loadComponent: () => import('./pages/codes/codes.page').then((m) => m.CodesPageComponent),
      },
      {
        path: 'codes/new',
        loadComponent: () => import('./pages/qr-create/qr-create.page').then((m) => m.QrCreatePageComponent),
      },
      {
        path: 'codes/:id',
        loadComponent: () => import('./pages/qr-detail/qr-detail.page').then((m) => m.QrDetailPageComponent),
      },
      {
        path: 'codes/:id/edit',
        loadComponent: () => import('./pages/qr-edit/qr-edit.page').then((m) => m.QrEditPageComponent),
      },
      {
        path: 'tags',
        loadComponent: () => import('./pages/tags/tags.page').then((m) => m.TagsPageComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPageComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'codes',
  },
];

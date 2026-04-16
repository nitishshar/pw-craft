import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'form-demo',
    loadComponent: () => import('./pages/form-demo/form-demo.component').then((m) => m.FormDemoComponent),
  },
  {
    path: 'async-demo',
    loadComponent: () => import('./pages/async-demo/async-demo.component').then((m) => m.AsyncDemoComponent),
  },
  {
    path: 'counter-demo',
    loadComponent: () => import('./pages/counter-demo/counter-demo.component').then((m) => m.CounterDemoComponent),
  },
  {
    path: 'animation-demo',
    loadComponent: () => import('./pages/animation-demo/animation-demo.component').then((m) => m.AnimationDemoComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

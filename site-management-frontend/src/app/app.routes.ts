import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  { 
    path: 'change-password', 
    loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'employees', 
    loadComponent: () => import('./features/employee/employee.component').then(m => m.EmployeeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'sites',
    loadComponent: () => import('./features/sites/sites.component').then(m => m.SitesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'payments',
    loadComponent: () => import('./features/payments/payments.component').then(m => m.PaymentsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'materials',
    loadComponent: () => import('./features/materials/materials.component').then(m => m.MaterialsComponent),
    canActivate: [authGuard]
  },
 
  { path: '**', redirectTo: '/login' }
];

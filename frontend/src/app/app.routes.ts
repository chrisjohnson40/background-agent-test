import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { LandingPageComponent } from './features/landing/landing-page.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'inventory', redirectTo: '', pathMatch: 'full', canActivate: [AuthGuard] }, // Protected - will be implemented later
  { path: 'locations', redirectTo: '', pathMatch: 'full', canActivate: [AuthGuard] }, // Protected - will be implemented later
  { path: 'categories', redirectTo: '', pathMatch: 'full', canActivate: [AuthGuard] }, // Protected - will be implemented later
  { path: 'reports', redirectTo: '', pathMatch: 'full', canActivate: [AuthGuard] }, // Protected - will be implemented later
  { path: 'profile', redirectTo: '', pathMatch: 'full', canActivate: [AuthGuard] }, // Protected - will be implemented later
  { path: 'settings', redirectTo: '', pathMatch: 'full', canActivate: [AuthGuard] }, // Protected - will be implemented later
  { path: '**', redirectTo: '' }
];

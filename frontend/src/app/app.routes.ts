import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { LandingPageComponent } from './features/landing/landing-page.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'inventory', redirectTo: '', pathMatch: 'full' }, // Placeholder - will be implemented later
  { path: 'locations', redirectTo: '', pathMatch: 'full' }, // Placeholder - will be implemented later
  { path: 'categories', redirectTo: '', pathMatch: 'full' }, // Placeholder - will be implemented later
  { path: 'reports', redirectTo: '', pathMatch: 'full' }, // Placeholder - will be implemented later
  { path: 'profile', redirectTo: '', pathMatch: 'full' }, // Placeholder - will be implemented later
  { path: 'settings', redirectTo: '', pathMatch: 'full' }, // Placeholder - will be implemented later
  { path: '**', redirectTo: '' }
];

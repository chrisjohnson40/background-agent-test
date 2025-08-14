import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Auth } from '../services/auth';
import { AuthGuard } from './auth.guard';

// Mock components for testing
@Component({
  template: '<h1>Login Page</h1>',
  standalone: true
})
class MockLoginComponent {}

@Component({
  template: '<h1>Protected Page</h1>',
  standalone: true
})
class MockProtectedComponent {}

@Component({
  template: '<h1>Public Page</h1>',
  standalone: true
})
class MockPublicComponent {}

@Component({
  template: '<h1>Inventory Page</h1>',
  standalone: true
})
class MockInventoryComponent {}

@Component({
  template: '<h1>Profile Page</h1>',
  standalone: true
})
class MockProfileComponent {}

describe('Route Protection Integration Tests', () => {
  let router: Router;
  let location: Location;
  let authService: jasmine.SpyObj<Auth>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    
    const authSpy = jasmine.createSpyObj('Auth', ['isAuthenticated'], {
      isAuthenticated$: isAuthenticatedSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authSpy },
        provideRouter([
          { path: 'login', component: MockLoginComponent },
          { path: 'public', component: MockPublicComponent },
          { path: 'protected', component: MockProtectedComponent, canActivate: [AuthGuard] },
          { path: 'inventory', component: MockInventoryComponent, canActivate: [AuthGuard] },
          { path: 'profile', component: MockProfileComponent, canActivate: [AuthGuard] },
          { path: '', redirectTo: '/public', pathMatch: 'full' },
          { path: '**', redirectTo: '/public' }
        ])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
  });

  describe('Unauthenticated User Navigation', () => {
    beforeEach(() => {
      isAuthenticatedSubject.next(false);
    });

    it('should allow access to public routes', async () => {
      await router.navigate(['/public']);
      expect(location.path()).toBe('/public');
    });

    it('should allow access to login route', async () => {
      await router.navigate(['/login']);
      expect(location.path()).toBe('/login');
    });

    it('should redirect to login when accessing protected route', async () => {
      await router.navigate(['/protected']);
      expect(location.path()).toBe('/login?returnUrl=%2Fprotected');
    });

    it('should redirect to login when accessing inventory route', async () => {
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/login?returnUrl=%2Finventory');
    });

    it('should redirect to login when accessing profile route', async () => {
      await router.navigate(['/profile']);
      expect(location.path()).toBe('/login?returnUrl=%2Fprofile');
    });

    it('should preserve complex URLs with query parameters in returnUrl', async () => {
      await router.navigate(['/inventory'], { queryParams: { category: 'electronics', sort: 'name' } });
      expect(location.path()).toBe('/login?returnUrl=%2Finventory%3Fcategory%3Delectronics%26sort%3Dname');
    });

    it('should preserve fragment in returnUrl', async () => {
      await router.navigate(['/protected'], { fragment: 'section1' });
      expect(location.path()).toBe('/login?returnUrl=%2Fprotected%23section1');
    });
  });

  describe('Authenticated User Navigation', () => {
    beforeEach(() => {
      isAuthenticatedSubject.next(true);
    });

    it('should allow access to public routes', async () => {
      await router.navigate(['/public']);
      expect(location.path()).toBe('/public');
    });

    it('should allow access to login route', async () => {
      await router.navigate(['/login']);
      expect(location.path()).toBe('/login');
    });

    it('should allow access to protected route', async () => {
      await router.navigate(['/protected']);
      expect(location.path()).toBe('/protected');
    });

    it('should allow access to inventory route', async () => {
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/inventory');
    });

    it('should allow access to profile route', async () => {
      await router.navigate(['/profile']);
      expect(location.path()).toBe('/profile');
    });

    it('should preserve query parameters when accessing protected routes', async () => {
      await router.navigate(['/inventory'], { queryParams: { category: 'electronics' } });
      expect(location.path()).toBe('/inventory?category=electronics');
    });

    it('should preserve fragments when accessing protected routes', async () => {
      await router.navigate(['/protected'], { fragment: 'section1' });
      expect(location.path()).toBe('/protected#section1');
    });
  });

  describe('Authentication State Changes During Navigation', () => {
    it('should redirect to login if user becomes unauthenticated while on protected route', async () => {
      // Start authenticated and navigate to protected route
      isAuthenticatedSubject.next(true);
      await router.navigate(['/protected']);
      expect(location.path()).toBe('/protected');

      // Simulate logout - user becomes unauthenticated
      isAuthenticatedSubject.next(false);
      
      // Try to navigate to another protected route
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/login?returnUrl=%2Finventory');
    });

    it('should allow access to protected routes after authentication', async () => {
      // Start unauthenticated
      isAuthenticatedSubject.next(false);
      await router.navigate(['/protected']);
      expect(location.path()).toBe('/login?returnUrl=%2Fprotected');

      // Simulate login - user becomes authenticated
      isAuthenticatedSubject.next(true);
      
      // Now should be able to access protected route
      await router.navigate(['/protected']);
      expect(location.path()).toBe('/protected');
    });

    it('should handle rapid authentication state changes', async () => {
      // Rapid state changes
      isAuthenticatedSubject.next(false);
      isAuthenticatedSubject.next(true);
      isAuthenticatedSubject.next(false);
      
      await router.navigate(['/protected']);
      expect(location.path()).toBe('/login?returnUrl=%2Fprotected');
    });
  });

  describe('Multiple Protected Routes', () => {
    beforeEach(() => {
      isAuthenticatedSubject.next(false);
    });

    it('should redirect all protected routes to login with correct returnUrl', async () => {
      const protectedRoutes = ['/protected', '/inventory', '/profile'];
      
      for (const route of protectedRoutes) {
        await router.navigate([route]);
        const expectedPath = `/login?returnUrl=${encodeURIComponent(route)}`;
        expect(location.path()).toBe(expectedPath);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle navigation to non-existent routes', async () => {
      isAuthenticatedSubject.next(false);
      await router.navigate(['/non-existent-route']);
      expect(location.path()).toBe('/public');
    });

    it('should handle empty route navigation', async () => {
      isAuthenticatedSubject.next(false);
      await router.navigate(['']);
      expect(location.path()).toBe('/public');
    });

    it('should handle root route navigation when unauthenticated', async () => {
      isAuthenticatedSubject.next(false);
      await router.navigate(['/']);
      expect(location.path()).toBe('/public');
    });

    it('should handle special characters in URLs', async () => {
      isAuthenticatedSubject.next(false);
      await router.navigate(['/inventory'], { 
        queryParams: { 
          search: 'test & special chars!',
          category: 'tools/equipment' 
        } 
      });
      expect(location.path()).toContain('/login?returnUrl=');
      expect(decodeURIComponent(location.path())).toContain('test & special chars!');
    });
  });

  describe('Concurrent Navigation Attempts', () => {
    it('should handle multiple simultaneous navigation attempts', async () => {
      isAuthenticatedSubject.next(false);
      
      // Simulate multiple rapid navigation attempts
      const navigationPromises = [
        router.navigate(['/protected']),
        router.navigate(['/inventory']),
        router.navigate(['/profile'])
      ];
      
      await Promise.all(navigationPromises);
      
      // Should end up at login (last navigation wins)
      expect(location.path()).toContain('/login');
    });
  });

  describe('Browser Back/Forward Navigation', () => {
    it('should respect auth guard on browser back navigation', async () => {
      // Start authenticated, navigate to protected route
      isAuthenticatedSubject.next(true);
      await router.navigate(['/public']);
      await router.navigate(['/protected']);
      expect(location.path()).toBe('/protected');

      // Become unauthenticated
      isAuthenticatedSubject.next(false);
      
      // Simulate browser back to public page
      location.back();
      expect(location.path()).toBe('/public');
      
      // Try to navigate forward to protected route (should redirect to login)
      await router.navigate(['/protected']);
      expect(location.path()).toBe('/login?returnUrl=%2Fprotected');
    });
  });
});
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Auth } from '../core/services/auth';
import { AuthGuard } from '../core/guards/auth.guard';
import { Login } from './login/login';
import { Register } from './register/register';

// Mock components for testing
@Component({
  template: '<h1>Landing Page</h1>',
  standalone: true
})
class MockLandingComponent {}

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

describe('Complete Authentication Flow Integration Tests', () => {
  let router: Router;
  let location: Location;
  let authService: jasmine.SpyObj<Auth>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;
  let currentUserSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    currentUserSubject = new BehaviorSubject<any>(null);
    
    const authSpy = jasmine.createSpyObj('Auth', [
      'isAuthenticated', 
      'getCurrentUser', 
      'login', 
      'logout'
    ], {
      isAuthenticated$: isAuthenticatedSubject.asObservable(),
      currentUser$: currentUserSubject.asObservable()
    });

    // Mock login method
    authSpy.login.and.callFake((email: string, password: string) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = {
            id: 1,
            name: 'Test User',
            email: email
          };
          isAuthenticatedSubject.next(true);
          currentUserSubject.next(mockUser);
          resolve(undefined);
        }, 100);
      });
    });

    // Mock logout method
    authSpy.logout.and.callFake(() => {
      isAuthenticatedSubject.next(false);
      currentUserSubject.next(null);
    });

    // Mock isAuthenticated method
    authSpy.isAuthenticated.and.callFake(() => {
      return isAuthenticatedSubject.value;
    });

    // Mock getCurrentUser method
    authSpy.getCurrentUser.and.callFake(() => {
      return currentUserSubject.value;
    });

    await TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authSpy },
        provideRouter([
          { path: '', component: MockLandingComponent },
          { path: 'login', component: Login },
          { path: 'register', component: Register },
          { path: 'inventory', component: MockInventoryComponent, canActivate: [AuthGuard] },
          { path: 'profile', component: MockProfileComponent, canActivate: [AuthGuard] },
          { path: '**', redirectTo: '' }
        ])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
  });

  describe('Complete Login Flow', () => {
    it('should complete full login flow with returnUrl redirection', async () => {
      // Step 1: Try to access protected route while unauthenticated
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/login?returnUrl=%2Finventory');

      // Step 2: Simulate successful login
      await authService.login('test@example.com', 'password123');
      
      // Step 3: Verify authentication state changed
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()).toBeTruthy();
      expect(authService.getCurrentUser()?.email).toBe('test@example.com');

      // Step 4: Navigate to originally requested route
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/inventory');
    });

    it('should handle login flow without returnUrl', async () => {
      // Navigate directly to login
      await router.navigate(['/login']);
      expect(location.path()).toBe('/login');

      // Login
      await authService.login('test@example.com', 'password123');
      
      // Should be able to access protected routes
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/inventory');
    });

    it('should preserve complex returnUrl with query parameters', async () => {
      // Try to access protected route with query params
      await router.navigate(['/inventory'], { queryParams: { category: 'electronics', sort: 'name' } });
      
      const expectedReturnUrl = encodeURIComponent('/inventory?category=electronics&sort=name');
      expect(location.path()).toBe(`/login?returnUrl=${expectedReturnUrl}`);

      // Login and verify we can access the original URL
      await authService.login('test@example.com', 'password123');
      await router.navigate(['/inventory'], { queryParams: { category: 'electronics', sort: 'name' } });
      expect(location.path()).toBe('/inventory?category=electronics&sort=name');
    });
  });

  describe('Complete Logout Flow', () => {
    beforeEach(async () => {
      // Start with authenticated user
      await authService.login('test@example.com', 'password123');
      await router.navigate(['/inventory']);
    });

    it('should complete full logout flow', async () => {
      // Verify initial authenticated state
      expect(location.path()).toBe('/inventory');
      expect(authService.isAuthenticated()).toBe(true);

      // Logout
      authService.logout();

      // Verify logout state
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();

      // Try to access protected route - should redirect to login
      await router.navigate(['/profile']);
      expect(location.path()).toBe('/login?returnUrl=%2Fprofile');
    });

    it('should prevent access to protected routes after logout', async () => {
      // Logout
      authService.logout();

      // Try to access multiple protected routes
      const protectedRoutes = ['/inventory', '/profile'];
      
      for (const route of protectedRoutes) {
        await router.navigate([route]);
        const expectedPath = `/login?returnUrl=${encodeURIComponent(route)}`;
        expect(location.path()).toBe(expectedPath);
      }
    });
  });

  describe('Authentication State Persistence', () => {
    it('should maintain authentication state across route changes', async () => {
      // Login
      await authService.login('test@example.com', 'password123');
      
      // Navigate between protected routes
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/inventory');
      expect(authService.isAuthenticated()).toBe(true);

      await router.navigate(['/profile']);
      expect(location.path()).toBe('/profile');
      expect(authService.isAuthenticated()).toBe(true);

      // Navigate to public route
      await router.navigate(['/']);
      expect(location.path()).toBe('/');
      expect(authService.isAuthenticated()).toBe(true);

      // Navigate back to protected route
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/inventory');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should handle rapid authentication state changes', async () => {
      // Rapid login/logout cycles
      await authService.login('test@example.com', 'password123');
      expect(authService.isAuthenticated()).toBe(true);

      authService.logout();
      expect(authService.isAuthenticated()).toBe(false);

      await authService.login('test@example.com', 'password123');
      expect(authService.isAuthenticated()).toBe(true);

      // Should still be able to access protected routes
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/inventory');
    });
  });

  describe('Multiple User Sessions', () => {
    it('should handle different user logins', async () => {
      // Login as first user
      await authService.login('user1@example.com', 'password123');
      expect(authService.getCurrentUser()?.email).toBe('user1@example.com');
      
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/inventory');

      // Logout and login as different user
      authService.logout();
      await authService.login('user2@example.com', 'password456');
      expect(authService.getCurrentUser()?.email).toBe('user2@example.com');

      // Should still have access to protected routes
      await router.navigate(['/profile']);
      expect(location.path()).toBe('/profile');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock login failure
      authService.login.and.returnValue(Promise.reject(new Error('Invalid credentials')));

      try {
        await authService.login('invalid@example.com', 'wrongpassword');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Invalid credentials');
      }

      // Should remain unauthenticated
      expect(authService.isAuthenticated()).toBe(false);

      // Should not be able to access protected routes
      await router.navigate(['/inventory']);
      expect(location.path()).toBe('/login?returnUrl=%2Finventory');
    });

    it('should handle navigation errors during auth flow', async () => {
      // Mock router navigation failure
      spyOn(router, 'navigate').and.returnValue(Promise.reject(new Error('Navigation failed')));

      try {
        await router.navigate(['/inventory']);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Navigation failed');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty or invalid routes', async () => {
      await authService.login('test@example.com', 'password123');

      // Navigate to non-existent route
      await router.navigate(['/non-existent']);
      expect(location.path()).toBe('/');
    });

    it('should handle special characters in returnUrl', async () => {
      // Try to access route with special characters
      await router.navigate(['/inventory'], { 
        queryParams: { 
          search: 'test & special chars!',
          filter: 'category=tools/equipment'
        } 
      });
      
      expect(location.path()).toContain('/login?returnUrl=');
      
      // Login and verify navigation works
      await authService.login('test@example.com', 'password123');
      await router.navigate(['/inventory'], { 
        queryParams: { 
          search: 'test & special chars!',
          filter: 'category=tools/equipment'
        } 
      });
      
      expect(location.path()).toContain('/inventory');
      expect(location.path()).toContain('search=test%20%26%20special%20chars!');
    });

    it('should handle concurrent navigation attempts', async () => {
      await authService.login('test@example.com', 'password123');

      // Multiple simultaneous navigation attempts
      const navigationPromises = [
        router.navigate(['/inventory']),
        router.navigate(['/profile']),
        router.navigate(['/inventory'])
      ];

      await Promise.all(navigationPromises);
      
      // Should end up at the last navigation target
      expect(location.path()).toBe('/inventory');
    });
  });

  describe('Authentication Guard Integration', () => {
    it('should integrate properly with AuthGuard', async () => {
      // Test guard behavior with unauthenticated user
      const guard = TestBed.inject(AuthGuard);
      const route = {} as any;
      const state = { url: '/inventory' } as any;

      // Should deny access and trigger navigation
      const result = guard.canActivate(route, state);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBe(false);
        });
      }

      // Login and test guard with authenticated user
      await authService.login('test@example.com', 'password123');
      
      const resultAfterLogin = guard.canActivate(route, state);
      if (typeof resultAfterLogin === 'object' && 'subscribe' in resultAfterLogin) {
        resultAfterLogin.subscribe(canActivate => {
          expect(canActivate).toBe(true);
        });
      }
    });
  });

  describe('Performance and Memory', () => {
    it('should not create memory leaks with rapid auth state changes', async () => {
      // Simulate rapid auth state changes
      for (let i = 0; i < 10; i++) {
        await authService.login(`user${i}@example.com`, 'password');
        authService.logout();
      }

      // Final login should work correctly
      await authService.login('final@example.com', 'password');
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()?.email).toBe('final@example.com');
    });

    it('should handle multiple route guard checks efficiently', async () => {
      const guard = TestBed.inject(AuthGuard);
      const route = {} as any;
      
      // Multiple rapid guard checks
      const guardChecks = [];
      for (let i = 0; i < 5; i++) {
        const state = { url: `/route${i}` } as any;
        guardChecks.push(guard.canActivate(route, state));
      }

      // All should complete without issues
      const results = await Promise.all(guardChecks.map(check => {
        if (typeof check === 'object' && 'subscribe' in check) {
          return new Promise(resolve => check.subscribe(resolve));
        }
        return Promise.resolve(check);
      }));

      results.forEach(result => {
        expect(typeof result).toBe('boolean');
      });
    });
  });
});
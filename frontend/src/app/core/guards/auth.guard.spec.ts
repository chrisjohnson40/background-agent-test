import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { Auth } from '../services/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<Auth>;
  let router: jasmine.SpyObj<Router>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  beforeEach(() => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    
    const authSpy = jasmine.createSpyObj('Auth', ['isAuthenticated'], {
      isAuthenticated$: isAuthenticatedSubject.asObservable()
    });
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Auth, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    beforeEach(() => {
      route = {} as ActivatedRouteSnapshot;
      state = { url: '/protected-route' } as RouterStateSnapshot;
    });

    it('should allow access when user is authenticated', (done) => {
      // Arrange
      isAuthenticatedSubject.next(true);

      // Act
      const result = guard.canActivate(route, state);

      // Assert
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBe(true);
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBe(true);
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        });
      } else {
        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    it('should deny access and redirect to login when user is not authenticated', (done) => {
      // Arrange
      isAuthenticatedSubject.next(false);

      // Act
      const result = guard.canActivate(route, state);

      // Assert
      if (result instanceof Promise) {
        result.then(canActivate => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/protected-route' }
          });
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(canActivate => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/protected-route' }
          });
          done();
        });
      } else {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '/protected-route' }
        });
        done();
      }
    });

    it('should store the attempted URL for post-login redirect', (done) => {
      // Arrange
      isAuthenticatedSubject.next(false);
      state.url = '/inventory/items';

      // Act
      const result = guard.canActivate(route, state);

      // Assert
      if (result instanceof Promise) {
        result.then(() => {
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/inventory/items' }
          });
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(() => {
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/inventory/items' }
          });
          done();
        });
      } else {
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '/inventory/items' }
        });
        done();
      }
    });

    it('should handle root URL correctly', (done) => {
      // Arrange
      isAuthenticatedSubject.next(false);
      state.url = '/';

      // Act
      const result = guard.canActivate(route, state);

      // Assert
      if (result instanceof Promise) {
        result.then(() => {
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/' }
          });
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(() => {
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/' }
          });
          done();
        });
      } else {
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '/' }
        });
        done();
      }
    });

    it('should handle complex URLs with query parameters', (done) => {
      // Arrange
      isAuthenticatedSubject.next(false);
      state.url = '/inventory/items?category=electronics&sort=name';

      // Act
      const result = guard.canActivate(route, state);

      // Assert
      if (result instanceof Promise) {
        result.then(() => {
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/inventory/items?category=electronics&sort=name' }
          });
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(() => {
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/inventory/items?category=electronics&sort=name' }
          });
          done();
        });
      } else {
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '/inventory/items?category=electronics&sort=name' }
        });
        done();
      }
    });

    it('should only take one value from the authentication stream', (done) => {
      // Arrange
      let subscriptionCount = 0;
      const mockAuth = {
        isAuthenticated$: {
          pipe: jasmine.createSpy('pipe').and.callFake((takeOperator: any, mapOperator: any) => {
            subscriptionCount++;
            return of(true);
          })
        }
      };
      
      const guardWithMockAuth = new AuthGuard(mockAuth as any, router);

      // Act
      const result = guardWithMockAuth.canActivate(route, state);

      // Assert
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(() => {
          expect(mockAuth.isAuthenticated$.pipe).toHaveBeenCalledTimes(1);
          done();
        });
      } else {
        expect(mockAuth.isAuthenticated$.pipe).toHaveBeenCalledTimes(1);
        done();
      }
    });
  });

  describe('Authentication State Changes', () => {
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    beforeEach(() => {
      route = {} as ActivatedRouteSnapshot;
      state = { url: '/protected-route' } as RouterStateSnapshot;
    });

    it('should respond to authentication state changes', (done) => {
      // Arrange - start unauthenticated
      isAuthenticatedSubject.next(false);

      // Act - first check should deny access
      const result1 = guard.canActivate(route, state);
      
      if (typeof result1 === 'object' && 'subscribe' in result1) {
        result1.subscribe(canActivate1 => {
          expect(canActivate1).toBe(false);
          
          // Change to authenticated
          isAuthenticatedSubject.next(true);
          
          // Second check should allow access
          const result2 = guard.canActivate(route, state);
          if (typeof result2 === 'object' && 'subscribe' in result2) {
            result2.subscribe(canActivate2 => {
              expect(canActivate2).toBe(true);
              done();
            });
          } else {
            expect(result2).toBe(true);
            done();
          }
        });
      }
    });
  });

  describe('Error Handling', () => {
    let route: ActivatedRouteSnapshot;
    let state: RouterStateSnapshot;

    beforeEach(() => {
      route = {} as ActivatedRouteSnapshot;
      state = { url: '/protected-route' } as RouterStateSnapshot;
    });

    it('should handle router navigation errors gracefully', (done) => {
      // Arrange
      isAuthenticatedSubject.next(false);
      router.navigate.and.returnValue(Promise.reject(new Error('Navigation failed')));

      // Act
      const result = guard.canActivate(route, state);

      // Assert
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe({
          next: (canActivate) => {
            expect(canActivate).toBe(false);
            expect(router.navigate).toHaveBeenCalled();
            done();
          },
          error: (error) => {
            // Should not reach here - guard should handle navigation errors
            fail('Guard should handle navigation errors gracefully');
            done();
          }
        });
      }
    });
  });
});
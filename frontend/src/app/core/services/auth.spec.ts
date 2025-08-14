import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { Auth, User, RegisterRequest } from './auth';

describe('Auth', () => {
  let service: Auth;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Auth]
    });
    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Registration', () => {
    const mockRegisterRequest: RegisterRequest = {
      email: 'test@example.com',
      password: 'Password1!',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe'
    };

    const mockUser: User = {
      id: 1,
      name: 'John Doe',
      email: 'test@example.com',
      username: 'johndoe'
    };

    it('should register a new user successfully', () => {
      service.register(mockRegisterRequest).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRegisterRequest);
      req.flush(mockUser);
    });

    it('should handle registration errors', () => {
      const errorResponse = { error: { message: 'Email already exists' } };

      service.register(mockRegisterRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Email already exists');
        }
      });

      const req = httpMock.expectOne('/api/auth/register');
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should validate email format', () => {
      const invalidRequest = { ...mockRegisterRequest, email: 'invalid-email' };
      
      service.register(invalidRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.message).toContain('Invalid email format');
        }
      });

      const req = httpMock.expectOne('/api/auth/register');
      req.flush({ error: { message: 'Invalid email format' } }, { status: 400, statusText: 'Bad Request' });
    });

    it('should validate password strength', () => {
      const weakPasswordRequest = { ...mockRegisterRequest, password: 'weak' };
      
      service.register(weakPasswordRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.message).toContain('Password does not meet security requirements');
        }
      });

      const req = httpMock.expectOne('/api/auth/register');
      req.flush({ error: { message: 'Password does not meet security requirements' } }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle email uniqueness validation', () => {
      const existingEmailRequest = { ...mockRegisterRequest, email: 'existing@example.com' };
      
      service.register(existingEmailRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Email already exists');
        }
      });

      const req = httpMock.expectOne('/api/auth/register');
      req.flush({ error: { message: 'Email already exists' } }, { status: 409, statusText: 'Conflict' });
    });

    it('should handle username uniqueness validation', () => {
      const existingUsernameRequest = { ...mockRegisterRequest, username: 'existinguser' };
      
      service.register(existingUsernameRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Username already exists');
        }
      });

      const req = httpMock.expectOne('/api/auth/register');
      req.flush({ error: { message: 'Username already exists' } }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('Email Validation', () => {
    it('should validate email format correctly', () => {
      expect(service.isValidEmail('test@example.com')).toBeTruthy();
      expect(service.isValidEmail('user.name@domain.co.uk')).toBeTruthy();
      expect(service.isValidEmail('invalid-email')).toBeFalsy();
      expect(service.isValidEmail('test@')).toBeFalsy();
      expect(service.isValidEmail('@example.com')).toBeFalsy();
    });

    it('should check email uniqueness', () => {
      service.checkEmailExists('test@example.com').subscribe(exists => {
        expect(exists).toBeFalsy();
      });

      const req = httpMock.expectOne('/api/auth/check-email?email=test@example.com');
      expect(req.request.method).toBe('GET');
      req.flush({ exists: false });
    });

    it('should return true for existing email', () => {
      service.checkEmailExists('existing@example.com').subscribe(exists => {
        expect(exists).toBeTruthy();
      });

      const req = httpMock.expectOne('/api/auth/check-email?email=existing@example.com');
      req.flush({ exists: true });
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      expect(service.isValidPassword('Password1!')).toBeTruthy();
      expect(service.isValidPassword('MySecure123@')).toBeTruthy();
      expect(service.isValidPassword('Complex$Pass9')).toBeTruthy();
    });

    it('should reject weak passwords', () => {
      expect(service.isValidPassword('password')).toBeFalsy(); // no uppercase, number, symbol
      expect(service.isValidPassword('PASSWORD')).toBeFalsy(); // no lowercase, number, symbol
      expect(service.isValidPassword('Password')).toBeFalsy(); // no number, symbol
      expect(service.isValidPassword('Password1')).toBeFalsy(); // no symbol
      expect(service.isValidPassword('Pass1!')).toBeFalsy(); // too short
      expect(service.isValidPassword('')).toBeFalsy(); // empty
    });

    it('should get password strength requirements', () => {
      const requirements = service.getPasswordRequirements();
      expect(requirements).toContain('At least 8 characters long');
      expect(requirements).toContain('Contains uppercase letter');
      expect(requirements).toContain('Contains lowercase letter');
      expect(requirements).toContain('Contains number');
      expect(requirements).toContain('Contains special character');
    });

    it('should check individual password requirements', () => {
      const weakPassword = 'weak';
      const strongPassword = 'Password1!';

      expect(service.hasMinLength(weakPassword)).toBeFalsy();
      expect(service.hasMinLength(strongPassword)).toBeTruthy();

      expect(service.hasUppercase(weakPassword)).toBeFalsy();
      expect(service.hasUppercase(strongPassword)).toBeTruthy();

      expect(service.hasLowercase('PASSWORD')).toBeFalsy();
      expect(service.hasLowercase(strongPassword)).toBeTruthy();

      expect(service.hasNumber(weakPassword)).toBeFalsy();
      expect(service.hasNumber(strongPassword)).toBeTruthy();

      expect(service.hasSpecialChar(weakPassword)).toBeFalsy();
      expect(service.hasSpecialChar(strongPassword)).toBeTruthy();
    });
  });

  describe('Authentication State', () => {
    it('should initialize with unauthenticated state', () => {
      expect(service.isAuthenticated()).toBeFalsy();
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should update authentication state after login', async () => {
      await service.login('test@example.com', 'password');
      
      expect(service.isAuthenticated()).toBeTruthy();
      expect(service.getCurrentUser()).toBeTruthy();
    });

    it('should clear authentication state after logout', async () => {
      await service.login('test@example.com', 'password');
      service.logout();
      
      expect(service.isAuthenticated()).toBeFalsy();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('Login Functionality', () => {
    it('should successfully login with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'validpassword';

      await service.login(email, password);

      expect(service.isAuthenticated()).toBeTruthy();
      const currentUser = service.getCurrentUser();
      expect(currentUser).toBeTruthy();
      expect(currentUser?.email).toBe(email);
    });

    it('should handle login with username instead of email', async () => {
      const username = 'testuser';
      const password = 'validpassword';

      await service.login(username, password);

      expect(service.isAuthenticated()).toBeTruthy();
      const currentUser = service.getCurrentUser();
      expect(currentUser).toBeTruthy();
    });

    it('should reject login with empty username', async () => {
      try {
        await service.login('', 'password');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Username is required');
      }
    });

    it('should reject login with empty password', async () => {
      try {
        await service.login('testuser', '');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Password is required');
      }
    });

    it('should handle login failure with invalid credentials', async () => {
      service.login('invalid@example.com', 'wrongpassword').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Invalid username or password');
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: 'invalid@example.com',
        password: 'wrongpassword'
      });
      req.flush({ error: { message: 'Invalid username or password' } }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle login failure with inactive account', async () => {
      service.login('inactive@example.com', 'password').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Account is inactive');
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ error: { message: 'Account is inactive' } }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should make HTTP request to login endpoint', async () => {
      const loginRequest = {
        username: 'testuser',
        password: 'password123'
      };

      const mockResponse = {
        token: 'jwt-token-here',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser'
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      service.login(loginRequest.username, loginRequest.password).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      req.flush(mockResponse);
    });

    it('should store authentication token after successful login', async () => {
      const mockResponse = {
        token: 'jwt-token-here',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser'
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      service.login('testuser', 'password').subscribe(() => {
        expect(service.isAuthenticated()).toBeTruthy();
        expect(service.getCurrentUser()).toEqual(mockResponse.user);
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);
    });

    it('should handle network errors during login', async () => {
      service.login('testuser', 'password').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle server errors during login', async () => {
      service.login('testuser', 'password').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ error: { message: 'Internal server error' } }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should validate username format when using email', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];
      const invalidEmails = ['invalid-email', 'test@', '@example.com', 'test.example.com'];

      for (const email of validEmails) {
        expect(service.isValidEmail(email)).toBeTruthy(`${email} should be valid`);
      }

      for (const email of invalidEmails) {
        expect(service.isValidEmail(email)).toBeFalsy(`${email} should be invalid`);
      }
    });

    it('should handle concurrent login attempts', async () => {
      const promise1 = service.login('user1@example.com', 'password1');
      const promise2 = service.login('user2@example.com', 'password2');

      const requests = httpMock.match('/api/auth/login');
      expect(requests.length).toBe(2);

      requests[0].flush({
        token: 'token1',
        user: { id: 1, name: 'User 1', email: 'user1@example.com', username: 'user1' },
        expiresAt: new Date().toISOString()
      });

      requests[1].flush({
        token: 'token2',
        user: { id: 2, name: 'User 2', email: 'user2@example.com', username: 'user2' },
        expiresAt: new Date().toISOString()
      });

      await Promise.all([promise1, promise2]);
    });
  });

  describe('Login Form Validation', () => {
    it('should validate minimum username length', () => {
      expect(service.isValidUsername('ab')).toBeFalsy();
      expect(service.isValidUsername('abc')).toBeTruthy();
      expect(service.isValidUsername('validusername')).toBeTruthy();
    });

    it('should validate minimum password length', () => {
      expect(service.isValidPassword('12345')).toBeFalsy();
      expect(service.isValidPassword('123456')).toBeTruthy();
      expect(service.isValidPassword('validpassword')).toBeTruthy();
    });

    it('should validate required fields', () => {
      expect(service.isValidUsername('')).toBeFalsy();
      expect(service.isValidUsername('   ')).toBeFalsy();
      expect(service.isValidPassword('')).toBeFalsy();
      expect(service.isValidPassword('   ')).toBeFalsy();
    });

    it('should accept both username and email formats', () => {
      expect(service.isValidUsername('testuser')).toBeTruthy();
      expect(service.isValidUsername('test@example.com')).toBeTruthy();
      expect(service.isValidUsername('user.name@domain.co.uk')).toBeTruthy();
    });
  });

  describe('Session Management - Token Storage', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should store token in localStorage after successful login', () => {
      const mockResponse = {
        token: 'jwt-token-here',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser'
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      service.login('testuser', 'password').subscribe(() => {
        expect(localStorage.getItem('auth_token')).toBe(mockResponse.token);
        expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(mockResponse.user));
        expect(localStorage.getItem('auth_expires_at')).toBe(mockResponse.expiresAt);
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);
    });

    it('should retrieve token from localStorage on service initialization', () => {
      const mockToken = 'stored-jwt-token';
      const mockUser = {
        id: 1,
        name: 'Stored User',
        email: 'stored@example.com',
        username: 'storeduser'
      };
      const mockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_expires_at', mockExpiresAt);

      // Create new service instance to test initialization
      const newService = TestBed.inject(Auth);
      
      expect(newService.getToken()).toBe(mockToken);
      expect(newService.getCurrentUser()).toEqual(mockUser);
      expect(newService.isAuthenticated()).toBeTruthy();
    });

    it('should persist authentication state across browser sessions', () => {
      const mockResponse = {
        token: 'persistent-token',
        user: {
          id: 1,
          name: 'Persistent User',
          email: 'persistent@example.com',
          username: 'persistentuser'
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      service.login('persistentuser', 'password').subscribe(() => {
        // Simulate browser restart by creating new service instance
        const newService = TestBed.inject(Auth);
        
        expect(newService.isAuthenticated()).toBeTruthy();
        expect(newService.getCurrentUser()).toEqual(mockResponse.user);
        expect(newService.getToken()).toBe(mockResponse.token);
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);
    });

    it('should clear token storage on logout', () => {
      // First login
      const mockResponse = {
        token: 'token-to-clear',
        user: {
          id: 1,
          name: 'User To Logout',
          email: 'logout@example.com',
          username: 'logoutuser'
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      service.login('logoutuser', 'password').subscribe(() => {
        // Verify token is stored
        expect(localStorage.getItem('auth_token')).toBe(mockResponse.token);
        
        // Logout
        service.logout();
        
        // Verify all auth data is cleared
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('auth_user')).toBeNull();
        expect(localStorage.getItem('auth_expires_at')).toBeNull();
        expect(service.isAuthenticated()).toBeFalsy();
        expect(service.getCurrentUser()).toBeNull();
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('auth_token', 'valid-token');
      localStorage.setItem('auth_user', 'invalid-json');
      localStorage.setItem('auth_expires_at', 'invalid-date');

      const newService = TestBed.inject(Auth);
      
      expect(newService.isAuthenticated()).toBeFalsy();
      expect(newService.getCurrentUser()).toBeNull();
      expect(newService.getToken()).toBeNull();
    });
  });

  describe('Session Management - Token Expiration', () => {
    beforeEach(() => {
      localStorage.clear();
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should detect expired tokens', () => {
      const expiredDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago
      localStorage.setItem('auth_token', 'expired-token');
      localStorage.setItem('auth_expires_at', expiredDate);

      const newService = TestBed.inject(Auth);
      
      expect(newService.isTokenExpired()).toBeTruthy();
      expect(newService.isAuthenticated()).toBeFalsy();
    });

    it('should detect valid tokens', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
      localStorage.setItem('auth_token', 'valid-token');
      localStorage.setItem('auth_expires_at', futureDate);

      const newService = TestBed.inject(Auth);
      
      expect(newService.isTokenExpired()).toBeFalsy();
      expect(newService.isAuthenticated()).toBeTruthy();
    });

    it('should automatically logout when token expires', () => {
      const mockResponse = {
        token: 'short-lived-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser'
        },
        expiresAt: new Date(Date.now() + 1000).toISOString() // 1 second from now
      };

      service.login('testuser', 'password').subscribe(() => {
        expect(service.isAuthenticated()).toBeTruthy();
        
        // Fast forward time to expire token
        jasmine.clock().tick(2000);
        
        // Check if automatically logged out
        expect(service.isAuthenticated()).toBeFalsy();
        expect(service.getCurrentUser()).toBeNull();
        expect(localStorage.getItem('auth_token')).toBeNull();
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);
    });

    it('should emit authentication state changes on token expiration', () => {
      let authStateChanges: boolean[] = [];
      
      service.isAuthenticated$.subscribe(isAuth => {
        authStateChanges.push(isAuth);
      });

      const mockResponse = {
        token: 'expiring-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser'
        },
        expiresAt: new Date(Date.now() + 1000).toISOString()
      };

      service.login('testuser', 'password').subscribe(() => {
        // Fast forward to expire token
        jasmine.clock().tick(2000);
        
        expect(authStateChanges).toContain(false); // Initial state
        expect(authStateChanges).toContain(true);  // After login
        expect(authStateChanges[authStateChanges.length - 1]).toBeFalsy(); // After expiration
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);
    });
  });

  describe('Session Management - Token Refresh', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should refresh token before expiration', () => {
      const originalToken = 'original-token';
      const refreshedToken = 'refreshed-token';
      const nearExpiryDate = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
      const newExpiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

      localStorage.setItem('auth_token', originalToken);
      localStorage.setItem('auth_expires_at', nearExpiryDate);

      service.refreshToken().subscribe(response => {
        expect(response.token).toBe(refreshedToken);
        expect(localStorage.getItem('auth_token')).toBe(refreshedToken);
        expect(localStorage.getItem('auth_expires_at')).toBe(newExpiryDate);
      });

      const req = httpMock.expectOne('/api/auth/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${originalToken}`);
      req.flush({
        token: refreshedToken,
        expiresAt: newExpiryDate
      });
    });

    it('should automatically refresh token when near expiration', () => {
      const mockResponse = {
        token: 'auto-refresh-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser'
        },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      };

      service.login('testuser', 'password').subscribe(() => {
        // Service should automatically attempt to refresh token
        expect(service.shouldRefreshToken()).toBeTruthy();
      });

      const loginReq = httpMock.expectOne('/api/auth/login');
      loginReq.flush(mockResponse);

      // Expect automatic refresh request
      const refreshReq = httpMock.expectOne('/api/auth/refresh');
      refreshReq.flush({
        token: 'new-refreshed-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    });

    it('should handle refresh token failure', () => {
      const originalToken = 'failing-token';
      localStorage.setItem('auth_token', originalToken);
      localStorage.setItem('auth_expires_at', new Date(Date.now() + 5 * 60 * 1000).toISOString());

      service.refreshToken().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          // Should logout user on refresh failure
          expect(service.isAuthenticated()).toBeFalsy();
          expect(localStorage.getItem('auth_token')).toBeNull();
        }
      });

      const req = httpMock.expectOne('/api/auth/refresh');
      req.flush({ error: { message: 'Invalid refresh token' } }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should not refresh token if not near expiration', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
      localStorage.setItem('auth_token', 'valid-token');
      localStorage.setItem('auth_expires_at', futureDate);

      const newService = TestBed.inject(Auth);
      
      expect(newService.shouldRefreshToken()).toBeFalsy();
    });

    it('should refresh token when within refresh threshold', () => {
      const nearExpiryDate = new Date(Date.now() + 14 * 60 * 1000).toISOString(); // 14 minutes from now (within 15-minute threshold)
      localStorage.setItem('auth_token', 'token-to-refresh');
      localStorage.setItem('auth_expires_at', nearExpiryDate);

      const newService = TestBed.inject(Auth);
      
      expect(newService.shouldRefreshToken()).toBeTruthy();
    });
  });

  describe('Session Management - Logout Functionality', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should call logout endpoint on server', () => {
      const token = 'logout-token';
      localStorage.setItem('auth_token', token);

      service.logout().subscribe(() => {
        expect(service.isAuthenticated()).toBeFalsy();
      });

      const req = httpMock.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush({ success: true });
    });

    it('should clear all authentication data on logout', () => {
      // Setup authenticated state
      localStorage.setItem('auth_token', 'token-to-clear');
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Test User' }));
      localStorage.setItem('auth_expires_at', new Date().toISOString());

      service.logout().subscribe(() => {
        // Verify all data is cleared
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('auth_user')).toBeNull();
        expect(localStorage.getItem('auth_expires_at')).toBeNull();
        expect(service.isAuthenticated()).toBeFalsy();
        expect(service.getCurrentUser()).toBeNull();
        expect(service.getToken()).toBeNull();
      });

      const req = httpMock.expectOne('/api/auth/logout');
      req.flush({ success: true });
    });

    it('should handle logout even if server request fails', () => {
      localStorage.setItem('auth_token', 'token-to-clear');
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Test User' }));

      service.logout().subscribe(() => {
        // Should still clear local data even if server request fails
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(service.isAuthenticated()).toBeFalsy();
      });

      const req = httpMock.expectOne('/api/auth/logout');
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should emit authentication state change on logout', () => {
      let authStateChanges: boolean[] = [];
      
      service.isAuthenticated$.subscribe(isAuth => {
        authStateChanges.push(isAuth);
      });

      // Setup authenticated state
      localStorage.setItem('auth_token', 'token');
      const newService = TestBed.inject(Auth);

      newService.logout().subscribe(() => {
        expect(authStateChanges).toContain(true);  // Initial authenticated state
        expect(authStateChanges[authStateChanges.length - 1]).toBeFalsy(); // After logout
      });

      const req = httpMock.expectOne('/api/auth/logout');
      req.flush({ success: true });
    });

    it('should clear session storage as well as local storage', () => {
      // Setup data in both storages
      localStorage.setItem('auth_token', 'local-token');
      sessionStorage.setItem('temp_auth_data', 'temp-data');

      service.logout().subscribe(() => {
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(sessionStorage.getItem('temp_auth_data')).toBeNull();
      });

      const req = httpMock.expectOne('/api/auth/logout');
      req.flush({ success: true });
    });
  });
});

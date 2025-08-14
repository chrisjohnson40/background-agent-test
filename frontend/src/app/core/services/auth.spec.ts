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
});

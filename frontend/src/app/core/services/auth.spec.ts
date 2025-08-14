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
});

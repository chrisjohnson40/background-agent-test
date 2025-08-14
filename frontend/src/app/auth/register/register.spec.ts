import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { Register } from './register';
import { Auth } from '../../core/services/auth';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authService: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('Auth', ['register', 'login']);

    await TestBed.configureTestingModule({
      imports: [Register, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: Auth, useValue: authSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize with empty form', () => {
      expect(component.registerForm.get('email')?.value).toBe('');
      expect(component.registerForm.get('password')?.value).toBe('');
      expect(component.registerForm.get('confirmPassword')?.value).toBe('');
      expect(component.registerForm.get('firstName')?.value).toBe('');
      expect(component.registerForm.get('lastName')?.value).toBe('');
      expect(component.registerForm.get('username')?.value).toBe('');
    });

    it('should be invalid when empty', () => {
      expect(component.registerForm.valid).toBeFalsy();
    });

    describe('Email Validation', () => {
      it('should be invalid with empty email', () => {
        const emailControl = component.registerForm.get('email');
        expect(emailControl?.valid).toBeFalsy();
        expect(emailControl?.errors?.['required']).toBeTruthy();
      });

      it('should be invalid with malformed email', () => {
        const emailControl = component.registerForm.get('email');
        emailControl?.setValue('invalid-email');
        expect(emailControl?.valid).toBeFalsy();
        expect(emailControl?.errors?.['email']).toBeTruthy();
      });

      it('should be valid with proper email format', () => {
        const emailControl = component.registerForm.get('email');
        emailControl?.setValue('test@example.com');
        expect(emailControl?.errors?.['email']).toBeFalsy();
      });

      it('should show email format error message', () => {
        const emailControl = component.registerForm.get('email');
        emailControl?.setValue('invalid-email');
        emailControl?.markAsTouched();
        fixture.detectChanges();

        const errorElement = fixture.nativeElement.querySelector('[data-testid="email-error"]');
        expect(errorElement?.textContent).toContain('Please enter a valid email address');
      });

      it('should validate email uniqueness on blur', async () => {
        authService.register.and.returnValue(throwError(() => ({ error: { message: 'Email already exists' } })));
        
        const emailControl = component.registerForm.get('email');
        emailControl?.setValue('existing@example.com');
        
        component.checkEmailUniqueness();
        
        expect(component.emailExistsError).toBe('Email already exists');
      });
    });

    describe('Password Validation', () => {
      it('should be invalid with empty password', () => {
        const passwordControl = component.registerForm.get('password');
        expect(passwordControl?.valid).toBeFalsy();
        expect(passwordControl?.errors?.['required']).toBeTruthy();
      });

      it('should be invalid with password less than 8 characters', () => {
        const passwordControl = component.registerForm.get('password');
        passwordControl?.setValue('Pass1!');
        expect(passwordControl?.valid).toBeFalsy();
        expect(passwordControl?.errors?.['minlength']).toBeTruthy();
      });

      it('should be invalid without uppercase letter', () => {
        const passwordControl = component.registerForm.get('password');
        passwordControl?.setValue('password1!');
        expect(passwordControl?.valid).toBeFalsy();
        expect(passwordControl?.errors?.['pattern']).toBeTruthy();
      });

      it('should be invalid without lowercase letter', () => {
        const passwordControl = component.registerForm.get('password');
        passwordControl?.setValue('PASSWORD1!');
        expect(passwordControl?.valid).toBeFalsy();
        expect(passwordControl?.errors?.['pattern']).toBeTruthy();
      });

      it('should be invalid without number', () => {
        const passwordControl = component.registerForm.get('password');
        passwordControl?.setValue('Password!');
        expect(passwordControl?.valid).toBeFalsy();
        expect(passwordControl?.errors?.['pattern']).toBeTruthy();
      });

      it('should be invalid without special character', () => {
        const passwordControl = component.registerForm.get('password');
        passwordControl?.setValue('Password1');
        expect(passwordControl?.valid).toBeFalsy();
        expect(passwordControl?.errors?.['pattern']).toBeTruthy();
      });

      it('should be valid with strong password', () => {
        const passwordControl = component.registerForm.get('password');
        passwordControl?.setValue('Password1!');
        expect(passwordControl?.valid).toBeTruthy();
      });

      it('should show password strength requirements', () => {
        const passwordControl = component.registerForm.get('password');
        passwordControl?.setValue('weak');
        passwordControl?.markAsTouched();
        fixture.detectChanges();

        const requirements = fixture.nativeElement.querySelectorAll('[data-testid="password-requirement"]');
        expect(requirements.length).toBeGreaterThan(0);
      });
    });

    describe('Confirm Password Validation', () => {
      it('should be invalid when passwords do not match', () => {
        const passwordControl = component.registerForm.get('password');
        const confirmPasswordControl = component.registerForm.get('confirmPassword');
        
        passwordControl?.setValue('Password1!');
        confirmPasswordControl?.setValue('DifferentPassword1!');
        
        expect(component.registerForm.errors?.['passwordMismatch']).toBeTruthy();
      });

      it('should be valid when passwords match', () => {
        const passwordControl = component.registerForm.get('password');
        const confirmPasswordControl = component.registerForm.get('confirmPassword');
        
        passwordControl?.setValue('Password1!');
        confirmPasswordControl?.setValue('Password1!');
        
        expect(component.registerForm.errors?.['passwordMismatch']).toBeFalsy();
      });

      it('should show password mismatch error', () => {
        const passwordControl = component.registerForm.get('password');
        const confirmPasswordControl = component.registerForm.get('confirmPassword');
        
        passwordControl?.setValue('Password1!');
        confirmPasswordControl?.setValue('DifferentPassword1!');
        confirmPasswordControl?.markAsTouched();
        fixture.detectChanges();

        const errorElement = fixture.nativeElement.querySelector('[data-testid="confirm-password-error"]');
        expect(errorElement?.textContent).toContain('Passwords do not match');
      });
    });

    describe('Required Fields Validation', () => {
      it('should be invalid with empty username', () => {
        const usernameControl = component.registerForm.get('username');
        expect(usernameControl?.valid).toBeFalsy();
        expect(usernameControl?.errors?.['required']).toBeTruthy();
      });

      it('should be invalid with empty first name', () => {
        const firstNameControl = component.registerForm.get('firstName');
        expect(firstNameControl?.valid).toBeFalsy();
        expect(firstNameControl?.errors?.['required']).toBeTruthy();
      });

      it('should be invalid with empty last name', () => {
        const lastNameControl = component.registerForm.get('lastName');
        expect(lastNameControl?.valid).toBeFalsy();
        expect(lastNameControl?.errors?.['required']).toBeTruthy();
      });
    });
  });

  describe('Registration Process', () => {
    beforeEach(() => {
      // Fill form with valid data
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      });
    });

    it('should call register service on form submission', () => {
      authService.register.and.returnValue(of({ id: 1, email: 'test@example.com', username: 'johndoe' }));
      
      component.onSubmit();
      
      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password1!',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      });
    });

    it('should show loading state during registration', () => {
      authService.register.and.returnValue(of({ id: 1, email: 'test@example.com', username: 'johndoe' }).pipe());
      
      component.onSubmit();
      
      expect(component.isLoading).toBeTruthy();
    });

    it('should automatically login after successful registration', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'johndoe' };
      authService.register.and.returnValue(of(mockUser));
      authService.login.and.returnValue(Promise.resolve());
      
      await component.onSubmit();
      
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'Password1!');
    });

    it('should show success message after successful registration', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'johndoe' };
      authService.register.and.returnValue(of(mockUser));
      authService.login.and.returnValue(Promise.resolve());
      
      await component.onSubmit();
      
      expect(component.successMessage).toBe('Registration successful! You are now logged in.');
    });

    it('should handle registration errors', () => {
      const errorResponse = { error: { message: 'Registration failed' } };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Registration failed');
      expect(component.isLoading).toBeFalsy();
    });

    it('should handle email already exists error', () => {
      const errorResponse = { error: { message: 'Email already exists' } };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Email already exists');
    });

    it('should handle username already exists error', () => {
      const errorResponse = { error: { message: 'Username already exists' } };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(component.errorMessage).toBe('Username already exists');
    });

    it('should disable submit button when form is invalid', () => {
      component.registerForm.patchValue({
        email: 'invalid-email',
        password: 'weak'
      });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('[data-testid="submit-button"]');
      expect(submitButton?.disabled).toBeTruthy();
    });

    it('should enable submit button when form is valid', () => {
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('[data-testid="submit-button"]');
      expect(submitButton?.disabled).toBeFalsy();
    });
  });

  describe('UI Elements', () => {
    it('should display registration form', () => {
      const form = fixture.nativeElement.querySelector('form');
      expect(form).toBeTruthy();
    });

    it('should display all required input fields', () => {
      const emailInput = fixture.nativeElement.querySelector('input[formControlName="email"]');
      const passwordInput = fixture.nativeElement.querySelector('input[formControlName="password"]');
      const confirmPasswordInput = fixture.nativeElement.querySelector('input[formControlName="confirmPassword"]');
      const firstNameInput = fixture.nativeElement.querySelector('input[formControlName="firstName"]');
      const lastNameInput = fixture.nativeElement.querySelector('input[formControlName="lastName"]');
      const usernameInput = fixture.nativeElement.querySelector('input[formControlName="username"]');

      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(confirmPasswordInput).toBeTruthy();
      expect(firstNameInput).toBeTruthy();
      expect(lastNameInput).toBeTruthy();
      expect(usernameInput).toBeTruthy();
    });

    it('should display submit button', () => {
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton).toBeTruthy();
      expect(submitButton.textContent).toContain('Register');
    });

    it('should display error message when present', () => {
      component.errorMessage = 'Test error message';
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('[data-testid="error-message"]');
      expect(errorElement?.textContent).toContain('Test error message');
    });

    it('should display success message when present', () => {
      component.successMessage = 'Test success message';
      fixture.detectChanges();

      const successElement = fixture.nativeElement.querySelector('[data-testid="success-message"]');
      expect(successElement?.textContent).toContain('Test success message');
    });
  });
});

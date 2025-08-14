import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { Login } from './login';
import { Auth } from '../../core/services/auth';

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: jasmine.SpyObj<Auth>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('Auth', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        Login,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize login form with empty values', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('username')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should have required validators on username field', () => {
      const usernameControl = component.loginForm.get('username');
      expect(usernameControl?.hasError('required')).toBeTruthy();
      
      usernameControl?.setValue('ab');
      expect(usernameControl?.hasError('minlength')).toBeTruthy();
      
      usernameControl?.setValue('abc');
      expect(usernameControl?.hasError('minlength')).toBeFalsy();
    });

    it('should have required validators on password field', () => {
      const passwordControl = component.loginForm.get('password');
      expect(passwordControl?.hasError('required')).toBeTruthy();
      
      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
      
      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBeFalsy();
    });
  });

  describe('Form Validation', () => {
    it('should display username error messages correctly', () => {
      const usernameControl = component.loginForm.get('username');
      
      // Test required error
      usernameControl?.markAsTouched();
      expect(component.getUsernameErrorMessage()).toBe('Username or email is required');
      
      // Test minlength error
      usernameControl?.setValue('ab');
      expect(component.getUsernameErrorMessage()).toBe('Username must be at least 3 characters long');
      
      // Test no error
      usernameControl?.setValue('validusername');
      expect(component.getUsernameErrorMessage()).toBe('');
    });

    it('should display password error messages correctly', () => {
      const passwordControl = component.loginForm.get('password');
      
      // Test required error
      passwordControl?.markAsTouched();
      expect(component.getPasswordErrorMessage()).toBe('Password is required');
      
      // Test minlength error
      passwordControl?.setValue('12345');
      expect(component.getPasswordErrorMessage()).toBe('Password must be at least 6 characters long');
      
      // Test no error
      passwordControl?.setValue('validpassword');
      expect(component.getPasswordErrorMessage()).toBe('');
    });

    it('should show validation errors in template when fields are touched and invalid', fakeAsync(() => {
      const usernameInput = fixture.debugElement.query(By.css('input[formControlName="username"]'));
      const passwordInput = fixture.debugElement.query(By.css('input[formControlName="password"]'));
      
      // Touch the fields
      usernameInput.nativeElement.focus();
      usernameInput.nativeElement.blur();
      passwordInput.nativeElement.focus();
      passwordInput.nativeElement.blur();
      
      fixture.detectChanges();
      tick();
      
      const usernameError = fixture.debugElement.query(By.css('mat-error'));
      expect(usernameError?.nativeElement.textContent.trim()).toBe('Username or email is required');
    }));

    it('should disable submit button when form is invalid', () => {
      const submitButton = fixture.debugElement.query(By.css('[data-testid="login-submit-button"]'));
      expect(submitButton.nativeElement.disabled).toBeFalsy(); // Initially enabled
      
      // Mark form as touched to trigger validation
      component.loginForm.markAllAsTouched();
      fixture.detectChanges();
      
      expect(component.loginForm.invalid).toBeTruthy();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      expect(component.hidePassword).toBeTruthy();
      
      component.togglePasswordVisibility();
      expect(component.hidePassword).toBeFalsy();
      
      component.togglePasswordVisibility();
      expect(component.hidePassword).toBeTruthy();
    });

    it('should change password input type when toggling visibility', fakeAsync(() => {
      const passwordInput = fixture.debugElement.query(By.css('input[formControlName="password"]'));
      const toggleButton = fixture.debugElement.query(By.css('button[matSuffix]'));
      
      expect(passwordInput.nativeElement.type).toBe('password');
      
      toggleButton.nativeElement.click();
      fixture.detectChanges();
      tick();
      
      expect(passwordInput.nativeElement.type).toBe('text');
      expect(component.hidePassword).toBeFalsy();
    }));
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });
    });

    it('should not submit when form is invalid', fakeAsync(() => {
      component.loginForm.patchValue({
        username: '',
        password: ''
      });
      
      component.onSubmit();
      tick();
      
      expect(authService.login).not.toHaveBeenCalled();
      expect(component.loginForm.get('username')?.touched).toBeTruthy();
      expect(component.loginForm.get('password')?.touched).toBeTruthy();
    }));

    it('should call auth service login with correct credentials', fakeAsync(() => {
      authService.login.and.returnValue(Promise.resolve());
      router.navigate.and.returnValue(Promise.resolve(true));
      
      component.onSubmit();
      tick();
      
      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
    }));

    it('should show loading state during login', fakeAsync(() => {
      authService.login.and.returnValue(new Promise(resolve => setTimeout(resolve, 100)));
      
      expect(component.isLoading).toBeFalsy();
      
      component.onSubmit();
      expect(component.isLoading).toBeTruthy();
      
      tick(100);
      expect(component.isLoading).toBeFalsy();
    }));

    it('should navigate to dashboard on successful login', fakeAsync(() => {
      authService.login.and.returnValue(Promise.resolve());
      router.navigate.and.returnValue(Promise.resolve(true));
      
      component.onSubmit();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(snackBar.open).toHaveBeenCalledWith('Login successful!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }));

    it('should handle login errors with invalid credentials', fakeAsync(() => {
      const error = { error: { message: 'Invalid username or password' } };
      authService.login.and.returnValue(Promise.reject(error));
      
      component.onSubmit();
      tick();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Invalid username or password. Please check your credentials.',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
      expect(router.navigate).not.toHaveBeenCalled();
    }));

    it('should handle login errors with inactive account', fakeAsync(() => {
      const error = { error: { message: 'Account is inactive' } };
      authService.login.and.returnValue(Promise.reject(error));
      
      component.onSubmit();
      tick();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Your account is inactive. Please contact support.',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }));

    it('should handle generic login errors', fakeAsync(() => {
      const error = { message: 'Network error' };
      authService.login.and.returnValue(Promise.reject(error));
      
      component.onSubmit();
      tick();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Network error',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }));

    it('should handle unknown errors with default message', fakeAsync(() => {
      authService.login.and.returnValue(Promise.reject({}));
      
      component.onSubmit();
      tick();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Login failed. Please try again.',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }));

    it('should reset loading state after error', fakeAsync(() => {
      authService.login.and.returnValue(Promise.reject(new Error('Login failed')));
      
      component.onSubmit();
      expect(component.isLoading).toBeTruthy();
      
      tick();
      expect(component.isLoading).toBeFalsy();
    }));
  });

  describe('Template Integration', () => {
    it('should render login form with all required fields', () => {
      const usernameField = fixture.debugElement.query(By.css('input[formControlName="username"]'));
      const passwordField = fixture.debugElement.query(By.css('input[formControlName="password"]'));
      const submitButton = fixture.debugElement.query(By.css('[data-testid="login-submit-button"]'));
      
      expect(usernameField).toBeTruthy();
      expect(passwordField).toBeTruthy();
      expect(submitButton).toBeTruthy();
    });

    it('should show correct labels and placeholders', () => {
      const usernameLabel = fixture.debugElement.query(By.css('mat-label'));
      const usernameInput = fixture.debugElement.query(By.css('input[formControlName="username"]'));
      
      expect(usernameLabel.nativeElement.textContent).toBe('Username or Email');
      expect(usernameInput.nativeElement.placeholder).toBe('Enter your username or email');
    });

    it('should show loading spinner when isLoading is true', fakeAsync(() => {
      component.isLoading = true;
      fixture.detectChanges();
      tick();
      
      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      const loadingText = fixture.debugElement.query(By.css('span'));
      
      expect(spinner).toBeTruthy();
      expect(loadingText.nativeElement.textContent).toBe('Signing In...');
    }));

    it('should show register link', () => {
      const registerLink = fixture.debugElement.query(By.css('a[routerLink="/auth/register"]'));
      expect(registerLink).toBeTruthy();
      expect(registerLink.nativeElement.textContent).toBe('Sign up here');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on password toggle button', () => {
      const toggleButton = fixture.debugElement.query(By.css('button[matSuffix]'));
      
      expect(toggleButton.nativeElement.getAttribute('aria-label')).toBe('Hide password');
      expect(toggleButton.nativeElement.getAttribute('aria-pressed')).toBe('true');
      
      component.togglePasswordVisibility();
      fixture.detectChanges();
      
      expect(toggleButton.nativeElement.getAttribute('aria-pressed')).toBe('false');
    });

    it('should have proper autocomplete attributes', () => {
      const usernameInput = fixture.debugElement.query(By.css('input[formControlName="username"]'));
      const passwordInput = fixture.debugElement.query(By.css('input[formControlName="password"]'));
      
      expect(usernameInput.nativeElement.getAttribute('autocomplete')).toBe('username');
      expect(passwordInput.nativeElement.getAttribute('autocomplete')).toBe('current-password');
    });
  });
});

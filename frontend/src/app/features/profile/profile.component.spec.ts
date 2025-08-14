import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { ProfileService } from './profile.service';
import { Auth, User } from '../../core/services/auth';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockProfileService: jasmine.SpyObj<ProfileService>;
  let mockAuthService: jasmine.SpyObj<Auth>;

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com'
  };

  beforeEach(async () => {
    const profileServiceSpy = jasmine.createSpyObj('ProfileService', [
      'getUserProfile',
      'updateProfile',
      'changePassword'
    ]);
    const authServiceSpy = jasmine.createSpyObj('Auth', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: Auth, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    mockProfileService = TestBed.inject(ProfileService) as jasmine.SpyObj<ProfileService>;
    mockAuthService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load user profile on init', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockProfileService.getUserProfile.and.returnValue(of({
        id: '1',
        username: 'johndoe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe'
      }));

      component.ngOnInit();

      expect(mockProfileService.getUserProfile).toHaveBeenCalledWith(1);
      expect(component.profileForm.get('email')?.value).toBe('john.doe@example.com');
      expect(component.profileForm.get('firstName')?.value).toBe('John');
      expect(component.profileForm.get('lastName')?.value).toBe('Doe');
    });

    it('should handle error when loading profile fails', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockProfileService.getUserProfile.and.returnValue(throwError(() => new Error('Failed to load profile')));
      spyOn(component, 'showError');

      component.ngOnInit();

      expect(component.showError).toHaveBeenCalledWith('Failed to load profile information');
      expect(component.loading).toBeFalse();
    });
  });

  describe('Profile Form Validation', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockProfileService.getUserProfile.and.returnValue(of({
        id: '1',
        username: 'johndoe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe'
      }));
      component.ngOnInit();
    });

    it('should validate email format', () => {
      const emailControl = component.profileForm.get('email');
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBeFalsy();
    });

    it('should require first name', () => {
      const firstNameControl = component.profileForm.get('firstName');
      
      firstNameControl?.setValue('');
      expect(firstNameControl?.hasError('required')).toBeTruthy();
      
      firstNameControl?.setValue('John');
      expect(firstNameControl?.hasError('required')).toBeFalsy();
    });

    it('should require last name', () => {
      const lastNameControl = component.profileForm.get('lastName');
      
      lastNameControl?.setValue('');
      expect(lastNameControl?.hasError('required')).toBeTruthy();
      
      lastNameControl?.setValue('Doe');
      expect(lastNameControl?.hasError('required')).toBeFalsy();
    });

    it('should disable submit button when form is invalid', () => {
      component.profileForm.get('email')?.setValue('invalid-email');
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBeTruthy();
    });
  });

  describe('Profile Update', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockProfileService.getUserProfile.and.returnValue(of({
        id: '1',
        username: 'johndoe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe'
      }));
      component.ngOnInit();
    });

    it('should update profile successfully', () => {
      const updatedProfile = {
        email: 'john.updated@example.com',
        firstName: 'John',
        lastName: 'Updated'
      };
      
      mockProfileService.updateProfile.and.returnValue(of({
        id: '1',
        username: 'johndoe',
        email: 'john.updated@example.com',
        firstName: 'John',
        lastName: 'Updated',
        fullName: 'John Updated'
      }));
      spyOn(component, 'showSuccess');

      component.profileForm.patchValue(updatedProfile);
      component.onSubmit();

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(1, updatedProfile);
      expect(component.showSuccess).toHaveBeenCalledWith('Profile updated successfully');
      expect(component.loading).toBeFalse();
    });

    it('should handle update error', () => {
      mockProfileService.updateProfile.and.returnValue(throwError(() => new Error('Update failed')));
      spyOn(component, 'showError');

      component.onSubmit();

      expect(component.showError).toHaveBeenCalledWith('Failed to update profile');
      expect(component.loading).toBeFalse();
    });

    it('should not submit when form is invalid', () => {
      component.profileForm.get('email')?.setValue('invalid-email');
      
      component.onSubmit();

      expect(mockProfileService.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('Password Change', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockProfileService.getUserProfile.and.returnValue(of({
        id: '1',
        username: 'johndoe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe'
      }));
      component.ngOnInit();
    });

    it('should validate password change form', () => {
      const currentPasswordControl = component.passwordForm.get('currentPassword');
      const newPasswordControl = component.passwordForm.get('newPassword');
      const confirmPasswordControl = component.passwordForm.get('confirmPassword');

      // Test required validation
      expect(currentPasswordControl?.hasError('required')).toBeTruthy();
      expect(newPasswordControl?.hasError('required')).toBeTruthy();
      expect(confirmPasswordControl?.hasError('required')).toBeTruthy();

      // Test minimum length validation
      newPasswordControl?.setValue('123');
      expect(newPasswordControl?.hasError('minlength')).toBeTruthy();

      newPasswordControl?.setValue('12345678');
      expect(newPasswordControl?.hasError('minlength')).toBeFalsy();
    });

    it('should validate password confirmation match', () => {
      component.passwordForm.patchValue({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword'
      });

      expect(component.passwordForm.hasError('passwordMismatch')).toBeTruthy();

      component.passwordForm.patchValue({
        confirmPassword: 'newpassword123'
      });

      expect(component.passwordForm.hasError('passwordMismatch')).toBeFalsy();
    });

    it('should change password successfully', () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      mockProfileService.changePassword.and.returnValue(of({}));
      spyOn(component, 'showSuccess');

      component.passwordForm.patchValue(passwordData);
      component.onPasswordSubmit();

      expect(mockProfileService.changePassword).toHaveBeenCalledWith(1, {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      });
      expect(component.showSuccess).toHaveBeenCalledWith('Password changed successfully');
      expect(component.passwordForm.get('currentPassword')?.value).toBe('');
      expect(component.passwordForm.get('newPassword')?.value).toBe('');
      expect(component.passwordForm.get('confirmPassword')?.value).toBe('');
    });

    it('should handle password change error', () => {
      mockProfileService.changePassword.and.returnValue(throwError(() => new Error('Invalid current password')));
      spyOn(component, 'showError');

      component.passwordForm.patchValue({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      });
      component.onPasswordSubmit();

      expect(component.showError).toHaveBeenCalledWith('Failed to change password. Please check your current password.');
    });

    it('should not submit password change when form is invalid', () => {
      component.passwordForm.patchValue({
        currentPassword: 'oldpassword',
        newPassword: '123', // Too short
        confirmPassword: '123'
      });

      component.onPasswordSubmit();

      expect(mockProfileService.changePassword).not.toHaveBeenCalled();
    });
  });

  describe('UI Interactions', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockProfileService.getUserProfile.and.returnValue(of({
        id: '1',
        username: 'johndoe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe'
      }));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should display user profile information', () => {
      const emailInput = fixture.nativeElement.querySelector('input[formControlName="email"]');
      const firstNameInput = fixture.nativeElement.querySelector('input[formControlName="firstName"]');
      const lastNameInput = fixture.nativeElement.querySelector('input[formControlName="lastName"]');

      expect(emailInput.value).toBe('john.doe@example.com');
      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
    });

    it('should show loading state during profile update', () => {
      mockProfileService.updateProfile.and.returnValue(of({
        id: '1',
        username: 'johndoe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe'
      }));

      component.onSubmit();
      
      expect(component.loading).toBeTruthy();
    });

    it('should toggle password change form visibility', () => {
      expect(component.showPasswordForm).toBeFalsy();
      
      component.togglePasswordForm();
      
      expect(component.showPasswordForm).toBeTruthy();
      
      component.togglePasswordForm();
      
      expect(component.showPasswordForm).toBeFalsy();
    });
  });
});
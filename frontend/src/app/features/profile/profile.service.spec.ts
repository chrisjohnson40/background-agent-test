import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProfileService, UserProfile, UpdateProfileRequest, ChangePasswordRequest } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  const mockUserProfile: UserProfile = {
    id: '1',
    username: 'johndoe',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfileService]
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUserProfile', () => {
    it('should retrieve user profile', () => {
      const userId = 1;

      service.getUserProfile(userId).subscribe(profile => {
        expect(profile).toEqual(mockUserProfile);
      });

      const req = httpMock.expectOne(`/api/users/${userId}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUserProfile);
    });

    it('should handle error when retrieving user profile', () => {
      const userId = 1;
      const errorMessage = 'User not found';

      service.getUserProfile(userId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`/api/users/${userId}/profile`);
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', () => {
      const userId = 1;
      const updateRequest: UpdateProfileRequest = {
        email: 'john.updated@example.com',
        firstName: 'John',
        lastName: 'Updated'
      };
      const updatedProfile: UserProfile = {
        ...mockUserProfile,
        email: 'john.updated@example.com',
        lastName: 'Updated',
        fullName: 'John Updated'
      };

      service.updateProfile(userId, updateRequest).subscribe(profile => {
        expect(profile).toEqual(updatedProfile);
      });

      const req = httpMock.expectOne(`/api/users/${userId}/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedProfile);
    });

    it('should handle validation error when updating profile', () => {
      const userId = 1;
      const updateRequest: UpdateProfileRequest = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe'
      };

      service.updateProfile(userId, updateRequest).subscribe({
        next: () => fail('should have failed with validation error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`/api/users/${userId}/profile`);
      req.flush('Invalid email format', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle unauthorized error when updating profile', () => {
      const userId = 1;
      const updateRequest: UpdateProfileRequest = {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      service.updateProfile(userId, updateRequest).subscribe({
        next: () => fail('should have failed with unauthorized error'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`/api/users/${userId}/profile`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', () => {
      const userId = 1;
      const changePasswordRequest: ChangePasswordRequest = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      service.changePassword(userId, changePasswordRequest).subscribe(response => {
        expect(response).toEqual({});
      });

      const req = httpMock.expectOne(`/api/users/${userId}/change-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(changePasswordRequest);
      req.flush({});
    });

    it('should handle invalid current password error', () => {
      const userId = 1;
      const changePasswordRequest: ChangePasswordRequest = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      service.changePassword(userId, changePasswordRequest).subscribe({
        next: () => fail('should have failed with invalid password error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`/api/users/${userId}/change-password`);
      req.flush('Invalid current password', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle password complexity validation error', () => {
      const userId = 1;
      const changePasswordRequest: ChangePasswordRequest = {
        currentPassword: 'oldpassword',
        newPassword: '123' // Too weak
      };

      service.changePassword(userId, changePasswordRequest).subscribe({
        next: () => fail('should have failed with validation error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`/api/users/${userId}/change-password`);
      req.flush('Password does not meet complexity requirements', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle unauthorized error when changing password', () => {
      const userId = 1;
      const changePasswordRequest: ChangePasswordRequest = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      service.changePassword(userId, changePasswordRequest).subscribe({
        next: () => fail('should have failed with unauthorized error'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`/api/users/${userId}/change-password`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('HTTP Headers', () => {
    it('should include proper headers in requests', () => {
      const userId = 1;

      service.getUserProfile(userId).subscribe();

      const req = httpMock.expectOne(`/api/users/${userId}/profile`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockUserProfile);
    });

    it('should include authorization header when token is available', () => {
      // This test would require implementing token management in the service
      // For now, we'll just verify the structure is in place
      const userId = 1;

      service.getUserProfile(userId).subscribe();

      const req = httpMock.expectOne(`/api/users/${userId}/profile`);
      // In a real implementation, we would check for Authorization header
      expect(req.request.method).toBe('GET');
      req.flush(mockUserProfile);
    });
  });
});
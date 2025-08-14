import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface UpdateProfileRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = '/api/users';
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  getUserProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${userId}/profile`, this.httpOptions);
  }

  updateProfile(userId: number, updateRequest: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/${userId}/profile`, updateRequest, this.httpOptions);
  }

  changePassword(userId: number, changePasswordRequest: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/change-password`, changePasswordRequest, this.httpOptions);
  }
}
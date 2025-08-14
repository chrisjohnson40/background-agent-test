# Feature: User Authentication System

## Overview
Implement a complete user authentication system that connects the existing Angular frontend auth components to the .NET backend, providing secure JWT-based authentication with proper session management and route protection.

## Business Value
- **User Security**: Secure access to inventory management features
- **Personalization**: User-specific inventory and preferences
- **Data Protection**: Ensure users can only access their own inventory
- **Professional UX**: Complete login/logout flow users expect

## Technical Context
- **Frontend**: Angular 20 with existing Login/Register components and Auth service (currently mock)
- **Backend**: .NET 9 with complete auth interfaces, DTOs, and domain models already defined
- **Database**: PostgreSQL with User entity and auth tables ready
- **Security**: JWT tokens with BCrypt password hashing

## Acceptance Criteria

### User Registration
- [ ] Users can register with email, password, first name, last name
- [ ] Email validation ensures proper format and uniqueness
- [ ] Password validation enforces security requirements (8+ chars, mixed case, numbers, symbols)
- [ ] Successful registration automatically logs user in
- [ ] Registration errors display clear, user-friendly messages
- [ ] Password is securely hashed with BCrypt before storage

### User Login
- [ ] Users can log in with email/username and password
- [ ] Invalid credentials show appropriate error messages
- [ ] Successful login redirects to inventory dashboard
- [ ] Login state persists across browser sessions
- [ ] JWT token is stored securely (httpOnly cookie preferred)
- [ ] Token expiration is handled gracefully with refresh

### Session Management
- [ ] User remains logged in across browser restarts
- [ ] Automatic token refresh before expiration
- [ ] Logout clears all authentication data
- [ ] Expired tokens redirect to login page
- [ ] Multiple tab/window sessions work correctly

### Route Protection
- [ ] Unauthenticated users redirected to login from protected routes
- [ ] Auth guard protects inventory, locations, categories, reports, profile, settings routes
- [ ] Login/register pages redirect authenticated users to dashboard
- [ ] Navigation reflects authentication state (show/hide login button)

### User Profile
- [ ] Authenticated users can view their profile information
- [ ] Users can update their first name, last name, email
- [ ] Password change functionality with current password verification
- [ ] Profile changes are validated and saved to backend
- [ ] Success/error feedback for profile updates

### Backend Integration
- [ ] Frontend auth service connects to .NET API endpoints
- [ ] Proper error handling for network issues
- [ ] Request interceptor adds JWT token to authenticated requests
- [ ] Response interceptor handles 401/403 errors
- [ ] API endpoints return consistent error formats

### Security Requirements
- [ ] Passwords never sent in plain text
- [ ] JWT tokens have appropriate expiration times
- [ ] Sensitive routes require authentication
- [ ] HTTPS enforced in production
- [ ] Input validation on both frontend and backend
- [ ] Protection against common attacks (XSS, CSRF)

## Technical Implementation Details

### Frontend Components to Update
- `frontend/src/app/core/services/auth.ts` - Replace mock with real API calls
- `frontend/src/app/auth/login/login.ts` - Connect to auth service
- `frontend/src/app/auth/register/register.ts` - Connect to auth service
- `frontend/src/app/layout/navbar/navbar.component.ts` - Update auth state handling

### New Frontend Components Needed
- Route guards for protected routes
- HTTP interceptor for token management
- User profile component and service
- Error handling service for auth errors

### Backend Implementation Required
- Auth controller with login/register endpoints
- JWT token generation and validation service
- Password hashing service implementation
- User repository implementation
- Auth middleware for protected endpoints

### Database Considerations
- User table already exists in domain model
- Consider adding refresh token table for better security
- Ensure proper indexing on email field
- Add user roles table for future authorization

## API Endpoints to Implement

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password

## Testing Strategy

### Frontend Tests
- Unit tests for auth service API integration
- Component tests for login/register forms
- Integration tests for route guards
- E2E tests for complete auth flows

### Backend Tests
- Unit tests for auth service methods
- Integration tests for auth endpoints
- Security tests for token validation
- Performance tests for login endpoints

## Security Considerations
- Use HTTPS everywhere
- Implement proper CORS policies
- Store JWT tokens securely (httpOnly cookies)
- Add rate limiting to auth endpoints
- Log authentication events for monitoring
- Implement account lockout after failed attempts

## Future Enhancements
- OAuth2/OIDC integration (Google, Microsoft)
- Two-factor authentication (2FA)
- Role-based authorization
- Password reset functionality
- Email verification for registration
- Social login integration

## Dependencies
- Backend auth interfaces and DTOs (already exist)
- Frontend auth components (already exist)
- Database User entity (already exists)
- JWT library for .NET
- BCrypt library for password hashing

## Success Metrics
- Users can successfully register and login
- Authentication state persists correctly
- Protected routes are secure
- No authentication-related bugs or security issues
- Smooth user experience with proper error handling
- All tests pass with >90% coverage

## Notes
- This feature connects existing frontend and backend auth scaffolding
- Focus on security best practices throughout implementation
- Ensure consistent error handling and user feedback
- Consider mobile responsiveness for auth forms
- Plan for future OAuth2/OIDC integration in architecture

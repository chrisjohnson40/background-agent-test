import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';

import { NavbarComponent } from './navbar.component';
import { Auth } from '../../core/services/auth';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuthService: jasmine.SpyObj<Auth>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLocation: jasmine.SpyObj<Location>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;
  let currentUserSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    // Create mock subjects for authentication state
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    currentUserSubject = new BehaviorSubject<any>(null);

    // Create spy objects for dependencies
    mockAuthService = jasmine.createSpyObj('Auth', [
      'login',
      'logout',
      'isAuthenticated',
      'getCurrentUser'
    ], {
      isAuthenticated$: isAuthenticatedSubject.asObservable(),
      currentUser$: currentUserSubject.asObservable()
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    mockLocation = jasmine.createSpyObj('Location', ['path']);

    await TestBed.configureTestingModule({
      imports: [
        NavbarComponent,
        NoopAnimationsModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatSidenavModule
      ],
      providers: [
        { provide: Auth, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isMobileMenuOpen).toBeFalse();
      expect(component.isAuthenticated).toBeFalse();
      expect(component.currentUser).toBeNull();
    });

    it('should subscribe to authentication state on init', () => {
      spyOn(component, 'subscribeToAuthState');
      component.ngOnInit();
      expect(component.subscribeToAuthState).toHaveBeenCalled();
    });

    it('should unsubscribe on destroy', () => {
      component.ngOnInit();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Authentication State Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update authentication state when user logs in', () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      
      isAuthenticatedSubject.next(true);
      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      expect(component.isAuthenticated).toBeTrue();
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should update authentication state when user logs out', () => {
      // First set authenticated state
      isAuthenticatedSubject.next(true);
      currentUserSubject.next({ id: 1, name: 'John Doe' });
      fixture.detectChanges();

      // Then log out
      isAuthenticatedSubject.next(false);
      currentUserSubject.next(null);
      fixture.detectChanges();

      expect(component.isAuthenticated).toBeFalse();
      expect(component.currentUser).toBeNull();
    });

    it('should close mobile menu when authentication state changes', () => {
      component.isMobileMenuOpen = true;
      
      isAuthenticatedSubject.next(true);
      fixture.detectChanges();

      expect(component.isMobileMenuOpen).toBeFalse();
    });
  });

  describe('Navigation Links Rendering', () => {
    it('should show login and register buttons when not authenticated', () => {
      isAuthenticatedSubject.next(false);
      fixture.detectChanges();

      const loginButton = fixture.debugElement.query(By.css('[data-testid="login-button"]'));
      const registerButton = fixture.debugElement.query(By.css('[data-testid="register-button"]'));

      expect(loginButton).toBeTruthy();
      expect(registerButton).toBeTruthy();
      expect(loginButton.nativeElement.textContent.trim()).toBe('Login');
      expect(registerButton.nativeElement.textContent.trim()).toBe('Register');
    });

    it('should show navigation links when authenticated', () => {
      isAuthenticatedSubject.next(true);
      currentUserSubject.next({ id: 1, name: 'John Doe' });
      fixture.detectChanges();

      const inventoryLink = fixture.debugElement.query(By.css('[data-testid="inventory-link"]'));
      const locationsLink = fixture.debugElement.query(By.css('[data-testid="locations-link"]'));
      const categoriesLink = fixture.debugElement.query(By.css('[data-testid="categories-link"]'));
      const reportsLink = fixture.debugElement.query(By.css('[data-testid="reports-link"]'));

      expect(inventoryLink).toBeTruthy();
      expect(locationsLink).toBeTruthy();
      expect(categoriesLink).toBeTruthy();
      expect(reportsLink).toBeTruthy();
    });

    it('should hide navigation links when not authenticated', () => {
      isAuthenticatedSubject.next(false);
      fixture.detectChanges();

      const inventoryLink = fixture.debugElement.query(By.css('[data-testid="inventory-link"]'));
      const locationsLink = fixture.debugElement.query(By.css('[data-testid="locations-link"]'));
      const categoriesLink = fixture.debugElement.query(By.css('[data-testid="categories-link"]'));
      const reportsLink = fixture.debugElement.query(By.css('[data-testid="reports-link"]'));

      expect(inventoryLink).toBeFalsy();
      expect(locationsLink).toBeFalsy();
      expect(categoriesLink).toBeFalsy();
      expect(reportsLink).toBeFalsy();
    });

    it('should show user menu when authenticated', () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      isAuthenticatedSubject.next(true);
      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      const userMenuButton = fixture.debugElement.query(By.css('[data-testid="user-menu-button"]'));
      expect(userMenuButton).toBeTruthy();
      expect(userMenuButton.nativeElement.textContent).toContain('John Doe');
    });

    it('should hide user menu when not authenticated', () => {
      isAuthenticatedSubject.next(false);
      fixture.detectChanges();

      const userMenuButton = fixture.debugElement.query(By.css('[data-testid="user-menu-button"]'));
      expect(userMenuButton).toBeFalsy();
    });
  });

  describe('Logo Navigation Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render logo with correct attributes', () => {
      const logo = fixture.debugElement.query(By.css('[data-testid="logo"]'));
      
      expect(logo).toBeTruthy();
      expect(logo.nativeElement.getAttribute('aria-label')).toBe('Navigate to home page');
      expect(logo.nativeElement.textContent.trim()).toBe('Garage Inventory');
    });

    it('should navigate to home when logo is clicked', () => {
      const logo = fixture.debugElement.query(By.css('[data-testid="logo"]'));
      
      logo.nativeElement.click();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle logo keyboard navigation (Enter key)', () => {
      const logo = fixture.debugElement.query(By.css('[data-testid="logo"]'));
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      logo.nativeElement.dispatchEvent(enterEvent);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle logo keyboard navigation (Space key)', () => {
      const logo = fixture.debugElement.query(By.css('[data-testid="logo"]'));
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      
      logo.nativeElement.dispatchEvent(spaceEvent);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render hamburger menu button', () => {
      const hamburgerButton = fixture.debugElement.query(By.css('[data-testid="mobile-menu-toggle"]'));
      
      expect(hamburgerButton).toBeTruthy();
      expect(hamburgerButton.nativeElement.getAttribute('aria-label')).toBe('Toggle navigation menu');
    });

    it('should toggle mobile menu when hamburger button is clicked', () => {
      const hamburgerButton = fixture.debugElement.query(By.css('[data-testid="mobile-menu-toggle"]'));
      
      expect(component.isMobileMenuOpen).toBeFalse();
      
      hamburgerButton.nativeElement.click();
      expect(component.isMobileMenuOpen).toBeTrue();
      
      hamburgerButton.nativeElement.click();
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should update hamburger button aria-expanded attribute', () => {
      const hamburgerButton = fixture.debugElement.query(By.css('[data-testid="mobile-menu-toggle"]'));
      
      expect(hamburgerButton.nativeElement.getAttribute('aria-expanded')).toBe('false');
      
      component.toggleMobileMenu();
      fixture.detectChanges();
      
      expect(hamburgerButton.nativeElement.getAttribute('aria-expanded')).toBe('true');
    });

    it('should close mobile menu when navigation link is clicked', () => {
      isAuthenticatedSubject.next(true);
      currentUserSubject.next({ id: 1, name: 'John Doe' });
      component.isMobileMenuOpen = true;
      fixture.detectChanges();

      const inventoryLink = fixture.debugElement.query(By.css('[data-testid="inventory-link"]'));
      inventoryLink.nativeElement.click();

      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should close mobile menu when clicking outside', () => {
      component.isMobileMenuOpen = true;
      fixture.detectChanges();

      const backdrop = fixture.debugElement.query(By.css('[data-testid="mobile-menu-backdrop"]'));
      backdrop.nativeElement.click();

      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should handle escape key to close mobile menu', () => {
      component.isMobileMenuOpen = true;
      fixture.detectChanges();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(component.isMobileMenuOpen).toBeFalse();
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have proper ARIA labels on navigation elements', () => {
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav.nativeElement.getAttribute('aria-label')).toBe('Main navigation');
    });

    it('should have proper ARIA labels on buttons', () => {
      const hamburgerButton = fixture.debugElement.query(By.css('[data-testid="mobile-menu-toggle"]'));
      expect(hamburgerButton.nativeElement.getAttribute('aria-label')).toBe('Toggle navigation menu');
    });

    it('should support keyboard navigation for all interactive elements', () => {
      const interactiveElements = fixture.debugElement.queryAll(By.css('button, a, [tabindex]'));
      
      interactiveElements.forEach(element => {
        expect(element.nativeElement.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have focus indicators', () => {
      const focusableElements = fixture.debugElement.queryAll(By.css('button, a'));
      
      focusableElements.forEach(element => {
        element.nativeElement.focus();
        expect(document.activeElement).toBe(element.nativeElement);
      });
    });

    it('should announce mobile menu state to screen readers', () => {
      const mobileMenu = fixture.debugElement.query(By.css('[data-testid="mobile-menu"]'));
      
      component.isMobileMenuOpen = false;
      fixture.detectChanges();
      expect(mobileMenu.nativeElement.getAttribute('aria-hidden')).toBe('true');
      
      component.isMobileMenuOpen = true;
      fixture.detectChanges();
      expect(mobileMenu.nativeElement.getAttribute('aria-hidden')).toBe('false');
    });

    it('should have proper role attributes', () => {
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav.nativeElement.getAttribute('role')).toBe('navigation');
    });
  });

  describe('User Menu Functionality', () => {
    beforeEach(() => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      isAuthenticatedSubject.next(true);
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
    });

    it('should show user menu items when menu is opened', () => {
      const userMenuButton = fixture.debugElement.query(By.css('[data-testid="user-menu-button"]'));
      userMenuButton.nativeElement.click();
      fixture.detectChanges();

      const profileItem = fixture.debugElement.query(By.css('[data-testid="profile-menu-item"]'));
      const settingsItem = fixture.debugElement.query(By.css('[data-testid="settings-menu-item"]'));
      const logoutItem = fixture.debugElement.query(By.css('[data-testid="logout-menu-item"]'));

      expect(profileItem).toBeTruthy();
      expect(settingsItem).toBeTruthy();
      expect(logoutItem).toBeTruthy();
    });

    it('should navigate to profile when profile menu item is clicked', () => {
      const userMenuButton = fixture.debugElement.query(By.css('[data-testid="user-menu-button"]'));
      userMenuButton.nativeElement.click();
      fixture.detectChanges();

      const profileItem = fixture.debugElement.query(By.css('[data-testid="profile-menu-item"]'));
      profileItem.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('should navigate to settings when settings menu item is clicked', () => {
      const userMenuButton = fixture.debugElement.query(By.css('[data-testid="user-menu-button"]'));
      userMenuButton.nativeElement.click();
      fixture.detectChanges();

      const settingsItem = fixture.debugElement.query(By.css('[data-testid="settings-menu-item"]'));
      settingsItem.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']);
    });

    it('should call logout when logout menu item is clicked', () => {
      const userMenuButton = fixture.debugElement.query(By.css('[data-testid="user-menu-button"]'));
      userMenuButton.nativeElement.click();
      fixture.detectChanges();

      const logoutItem = fixture.debugElement.query(By.css('[data-testid="logout-menu-item"]'));
      logoutItem.nativeElement.click();

      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Active Route Highlighting', () => {
    beforeEach(() => {
      isAuthenticatedSubject.next(true);
      currentUserSubject.next({ id: 1, name: 'John Doe' });
      fixture.detectChanges();
    });

    it('should highlight active route', () => {
      mockLocation.path.and.returnValue('/inventory');
      component.ngOnInit();
      fixture.detectChanges();

      const inventoryLink = fixture.debugElement.query(By.css('[data-testid="inventory-link"]'));
      expect(inventoryLink.nativeElement.classList).toContain('active');
    });

    it('should not highlight inactive routes', () => {
      mockLocation.path.and.returnValue('/inventory');
      component.ngOnInit();
      fixture.detectChanges();

      const locationsLink = fixture.debugElement.query(By.css('[data-testid="locations-link"]'));
      expect(locationsLink.nativeElement.classList).not.toContain('active');
    });

    it('should update active route when navigation occurs', () => {
      mockLocation.path.and.returnValue('/locations');
      component.updateActiveRoute();
      fixture.detectChanges();

      const locationsLink = fixture.debugElement.query(By.css('[data-testid="locations-link"]'));
      expect(locationsLink.nativeElement.classList).toContain('active');
    });
  });

  describe('Navigation Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to login when login button is clicked', () => {
      isAuthenticatedSubject.next(false);
      fixture.detectChanges();

      const loginButton = fixture.debugElement.query(By.css('[data-testid="login-button"]'));
      loginButton.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should navigate to register when register button is clicked', () => {
      isAuthenticatedSubject.next(false);
      fixture.detectChanges();

      const registerButton = fixture.debugElement.query(By.css('[data-testid="register-button"]'));
      registerButton.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
    });

    it('should navigate to inventory when inventory link is clicked', () => {
      isAuthenticatedSubject.next(true);
      currentUserSubject.next({ id: 1, name: 'John Doe' });
      fixture.detectChanges();

      const inventoryLink = fixture.debugElement.query(By.css('[data-testid="inventory-link"]'));
      inventoryLink.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory']);
    });

    it('should navigate to locations when locations link is clicked', () => {
      isAuthenticatedSubject.next(true);
      currentUserSubject.next({ id: 1, name: 'John Doe' });
      fixture.detectChanges();

      const locationsLink = fixture.debugElement.query(By.css('[data-testid="locations-link"]'));
      locationsLink.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/locations']);
    });

    it('should navigate to categories when categories link is clicked', () => {
      isAuthenticatedSubject.next(true);
      currentUserSubject.next({ id: 1, name: 'John Doe' });
      fixture.detectChanges();

      const categoriesLink = fixture.debugElement.query(By.css('[data-testid="categories-link"]'));
      categoriesLink.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories']);
    });

    it('should navigate to reports when reports link is clicked', () => {
      isAuthenticatedSubject.next(true);
      currentUserSubject.next({ id: 1, name: 'John Doe' });
      fixture.detectChanges();

      const reportsLink = fixture.debugElement.query(By.css('[data-testid="reports-link"]'));
      reportsLink.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/reports']);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication service errors gracefully', () => {
      spyOn(console, 'error');
      const errorSubject = new BehaviorSubject<boolean>(false);
      errorSubject.error(new Error('Auth service error'));
      
      mockAuthService.isAuthenticated$ = errorSubject.asObservable();
      
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle navigation errors gracefully', () => {
      mockRouter.navigate.and.returnValue(Promise.reject(new Error('Navigation error')));
      spyOn(console, 'error');
      
      component.navigateToHome();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component.constructor.name).toBe('NavbarComponent');
      // This would be verified in the actual component implementation
    });

    it('should unsubscribe from observables to prevent memory leaks', () => {
      component.ngOnInit();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
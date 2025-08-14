import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, catchError, EMPTY, filter } from 'rxjs';

import { Auth, User } from '../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatDividerModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  isAuthenticated = false;
  currentUser: User | null = null;
  activeRoute = '';

  private destroy$ = new Subject<void>();

  constructor(
    private auth: Auth,
    private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscribeToAuthState();
    this.subscribeToRouterEvents();
    this.updateActiveRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  subscribeToAuthState(): void {
    this.auth.isAuthenticated$
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Auth service error:', error);
          return EMPTY;
        })
      )
      .subscribe((isAuthenticated) => {
        this.isAuthenticated = isAuthenticated;
        this.isMobileMenuOpen = false; // Close mobile menu when auth state changes
        this.cdr.markForCheck();
      });

    this.auth.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Auth service error:', error);
          return EMPTY;
        })
      )
      .subscribe((user) => {
        this.currentUser = user;
        this.cdr.markForCheck();
      });
  }

  subscribeToRouterEvents(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateActiveRoute();
        this.cdr.markForCheck();
      });
  }

  updateActiveRoute(): void {
    this.activeRoute = this.location.path();
  }

  isRouteActive(route: string): boolean {
    return this.activeRoute === route;
  }

  navigateToHome(): void {
    this.router.navigate(['/'])
      .catch((error) => {
        console.error('Navigation error:', error);
      });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
    this.closeMobileMenu();
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
    this.closeMobileMenu();
  }

  navigateToInventory(): void {
    this.router.navigate(['/inventory']);
    this.closeMobileMenu();
  }

  navigateToLocations(): void {
    this.router.navigate(['/locations']);
    this.closeMobileMenu();
  }

  navigateToCategories(): void {
    this.router.navigate(['/categories']);
    this.closeMobileMenu();
  }

  navigateToReports(): void {
    this.router.navigate(['/reports']);
    this.closeMobileMenu();
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.auth.logout();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  onLogoKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToHome();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}
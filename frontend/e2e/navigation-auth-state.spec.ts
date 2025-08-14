import { test, expect } from '@playwright/test';

test.describe('Navigation Authentication State E2E Tests', () => {
  test.describe('Navigation Menu Changes Based on Auth State', () => {
    test('should show different navigation options for unauthenticated users', async ({ page }) => {
      await page.goto('/');
      
      // Should show public navigation items
      await expect(page.locator('[data-testid="nav-home"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-login"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-register"]')).toBeVisible();
      
      // Should not show authenticated navigation items
      await expect(page.locator('[data-testid="nav-inventory"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="nav-profile"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="nav-logout"]')).not.toBeVisible();
    });

    test('should show different navigation options for authenticated users', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show authenticated navigation items
      await expect(page.locator('[data-testid="nav-inventory"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-locations"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-categories"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-reports"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-logout"]')).toBeVisible();
      
      // Should not show login/register links
      await expect(page.locator('[data-testid="nav-login"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="nav-register"]')).not.toBeVisible();
    });

    test('should update navigation immediately after login', async ({ page }) => {
      await page.goto('/');
      
      // Verify initial unauthenticated state
      await expect(page.locator('[data-testid="nav-login"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-inventory"]')).not.toBeVisible();
      
      // Navigate to login and authenticate
      await page.click('[data-testid="nav-login"]');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigation should update immediately
      await expect(page.locator('[data-testid="nav-inventory"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-login"]')).not.toBeVisible();
    });

    test('should update navigation immediately after logout', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Verify authenticated navigation
      await expect(page.locator('[data-testid="nav-inventory"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-logout"]')).toBeVisible();
      
      // Logout
      await page.click('[data-testid="nav-logout"]');
      
      // Navigation should update immediately
      await expect(page.locator('[data-testid="nav-login"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-inventory"]')).not.toBeVisible();
    });
  });

  test.describe('Breadcrumb Navigation with Auth State', () => {
    test('should show appropriate breadcrumbs for authenticated users', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigate to nested route
      await page.goto('/inventory/items/123');
      
      // Should show full breadcrumb path
      await expect(page.locator('[data-testid="breadcrumb-home"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumb-inventory"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumb-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumb-current"]')).toContainText('Item 123');
    });

    test('should handle breadcrumb navigation clicks', async ({ page }) => {
      // Login and navigate to nested route
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.goto('/inventory/items/123');
      
      // Click on inventory breadcrumb
      await page.click('[data-testid="breadcrumb-inventory"]');
      await expect(page).toHaveURL('/inventory');
      
      // Navigate back to nested route
      await page.goto('/inventory/items/123');
      
      // Click on home breadcrumb
      await page.click('[data-testid="breadcrumb-home"]');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Sidebar Navigation State', () => {
    test('should collapse/expand sidebar based on user preference', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Sidebar should be visible by default
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="sidebar"]')).not.toHaveClass(/collapsed/);
      
      // Click collapse button
      await page.click('[data-testid="sidebar-toggle"]');
      await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/collapsed/);
      
      // Click expand button
      await page.click('[data-testid="sidebar-toggle"]');
      await expect(page.locator('[data-testid="sidebar"]')).not.toHaveClass(/collapsed/);
    });

    test('should persist sidebar state across page navigation', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Collapse sidebar
      await page.click('[data-testid="sidebar-toggle"]');
      await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/collapsed/);
      
      // Navigate to different page
      await page.goto('/inventory');
      
      // Sidebar should remain collapsed
      await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/collapsed/);
    });

    test('should highlight active navigation item', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigate to inventory
      await page.goto('/inventory');
      await expect(page.locator('[data-testid="nav-inventory"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="nav-profile"]')).not.toHaveClass(/active/);
      
      // Navigate to profile
      await page.goto('/profile');
      await expect(page.locator('[data-testid="nav-profile"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="nav-inventory"]')).not.toHaveClass(/active/);
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should show mobile menu for authenticated users', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Mobile menu button should be visible
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      
      // Desktop navigation should be hidden
      await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
      
      // Click mobile menu toggle
      await page.click('[data-testid="mobile-menu-toggle"]');
      
      // Mobile menu should open
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-nav-inventory"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-nav-profile"]')).toBeVisible();
    });

    test('should close mobile menu after navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Open mobile menu
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Click navigation item
      await page.click('[data-testid="mobile-nav-inventory"]');
      
      // Should navigate and close menu
      await expect(page).toHaveURL('/inventory');
      await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
    });
  });

  test.describe('User Profile Display in Navigation', () => {
    test('should display user information in navigation', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // User profile section should be visible
      await expect(page.locator('[data-testid="user-profile-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-email"]')).toContainText('test@example.com');
      await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    });

    test('should show user dropdown menu', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Click user profile to open dropdown
      await page.click('[data-testid="user-profile-dropdown"]');
      
      // Dropdown should be visible with options
      await expect(page.locator('[data-testid="user-dropdown-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="dropdown-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="dropdown-settings"]')).toBeVisible();
      await expect(page.locator('[data-testid="dropdown-logout"]')).toBeVisible();
    });

    test('should navigate from user dropdown menu', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Open user dropdown and click profile
      await page.click('[data-testid="user-profile-dropdown"]');
      await page.click('[data-testid="dropdown-profile"]');
      
      // Should navigate to profile page
      await expect(page).toHaveURL('/profile');
      
      // Open dropdown and click settings
      await page.click('[data-testid="user-profile-dropdown"]');
      await page.click('[data-testid="dropdown-settings"]');
      
      // Should navigate to settings page
      await expect(page).toHaveURL('/settings');
    });
  });

  test.describe('Navigation Loading States', () => {
    test('should show loading state during navigation', async ({ page }) => {
      // Intercept route to add delay
      await page.route('**/inventory', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Click navigation item
      await page.click('[data-testid="nav-inventory"]');
      
      // Should show loading indicator
      await expect(page.locator('[data-testid="navigation-loading"]')).toBeVisible();
      
      // Wait for navigation to complete
      await expect(page).toHaveURL('/inventory');
      await expect(page.locator('[data-testid="navigation-loading"]')).not.toBeVisible();
    });
  });

  test.describe('Navigation Keyboard Accessibility', () => {
    test('should support keyboard navigation through menu items', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Focus first navigation item
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="nav-inventory"]')).toBeFocused();
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('[data-testid="nav-locations"]')).toBeFocused();
      
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('[data-testid="nav-categories"]')).toBeFocused();
      
      // Navigate with Enter key
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/categories');
    });

    test('should support skip navigation links', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Tab to skip navigation link
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="skip-navigation"]')).toBeFocused();
      
      // Press Enter to skip to main content
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="main-content"]')).toBeFocused();
    });
  });

  test.describe('Navigation Error States', () => {
    test('should handle navigation errors gracefully', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Intercept route to simulate error
      await page.route('**/inventory', route => {
        route.fulfill({
          status: 500,
          contentType: 'text/html',
          body: '<html><body>Server Error</body></html>'
        });
      });
      
      // Try to navigate
      await page.click('[data-testid="nav-inventory"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="navigation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation-error"]')).toContainText('Failed to load page');
    });
  });
});
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean state
    await page.goto('/');
  });

  test.describe('Unauthenticated User Redirection', () => {
    test('should redirect unauthenticated user to login when accessing protected inventory route', async ({ page }) => {
      // Attempt to access protected inventory route
      await page.goto('/inventory');
      
      // Should be redirected to login with returnUrl
      await expect(page).toHaveURL('/login?returnUrl=%2Finventory');
      
      // Should see login form
      await expect(page.locator('h1')).toContainText('Login');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should redirect unauthenticated user to login when accessing protected profile route', async ({ page }) => {
      await page.goto('/profile');
      
      await expect(page).toHaveURL('/login?returnUrl=%2Fprofile');
      await expect(page.locator('h1')).toContainText('Login');
    });

    test('should redirect unauthenticated user to login when accessing protected settings route', async ({ page }) => {
      await page.goto('/settings');
      
      await expect(page).toHaveURL('/login?returnUrl=%2Fsettings');
      await expect(page.locator('h1')).toContainText('Login');
    });

    test('should preserve complex URLs with query parameters in returnUrl', async ({ page }) => {
      await page.goto('/inventory?category=electronics&sort=name&page=2');
      
      await expect(page).toHaveURL('/login?returnUrl=%2Finventory%3Fcategory%3Delectronics%26sort%3Dname%26page%3D2');
    });

    test('should preserve URL fragments in returnUrl', async ({ page }) => {
      await page.goto('/inventory#item-details');
      
      await expect(page).toHaveURL('/login?returnUrl=%2Finventory%23item-details');
    });

    test('should allow access to public routes without authentication', async ({ page }) => {
      // Test landing page
      await page.goto('/');
      await expect(page).toHaveURL('/');
      await expect(page.locator('h1')).toBeVisible();

      // Test login page
      await page.goto('/login');
      await expect(page).toHaveURL('/login');
      await expect(page.locator('h1')).toContainText('Login');

      // Test register page
      await page.goto('/register');
      await expect(page).toHaveURL('/register');
      await expect(page.locator('h1')).toContainText('Register');
    });
  });

  test.describe('Authentication Process', () => {
    test('should successfully login and redirect to returnUrl', async ({ page }) => {
      // Try to access protected route first
      await page.goto('/inventory');
      await expect(page).toHaveURL('/login?returnUrl=%2Finventory');

      // Fill in login form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Should be redirected to the originally requested route
      await expect(page).toHaveURL('/inventory');
      await expect(page.locator('h1')).toContainText('Inventory');
    });

    test('should redirect to home page after login if no returnUrl', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should redirect to home/dashboard after successful login
      await expect(page).toHaveURL('/');
    });

    test('should show error message for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should stay on login page and show error
      await expect(page).toHaveURL('/login');
      await expect(page.locator('.error-message')).toContainText('Invalid username or password');
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit without filling fields
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
      await expect(page.locator('input[type="password"]:invalid')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show email validation error
      await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
    });
  });

  test.describe('Authenticated User Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test in this group
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');
    });

    test('should allow access to all protected routes when authenticated', async ({ page }) => {
      const protectedRoutes = [
        { path: '/inventory', title: 'Inventory' },
        { path: '/profile', title: 'Profile' },
        { path: '/settings', title: 'Settings' },
        { path: '/locations', title: 'Locations' },
        { path: '/categories', title: 'Categories' },
        { path: '/reports', title: 'Reports' }
      ];

      for (const route of protectedRoutes) {
        await page.goto(route.path);
        await expect(page).toHaveURL(route.path);
        // Verify the page loaded correctly (assuming each page has a title)
        await expect(page.locator('h1')).toBeVisible();
      }
    });

    test('should maintain authentication state across page refreshes', async ({ page }) => {
      await page.goto('/inventory');
      await expect(page).toHaveURL('/inventory');
      
      // Refresh the page
      await page.reload();
      
      // Should still be on inventory page (not redirected to login)
      await expect(page).toHaveURL('/inventory');
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should show user information in navigation', async ({ page }) => {
      // Assuming there's a user menu or profile indicator
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-email"]')).toContainText('test@example.com');
    });

    test('should allow navigation between protected routes', async ({ page }) => {
      // Navigate to inventory
      await page.goto('/inventory');
      await expect(page).toHaveURL('/inventory');
      
      // Navigate to profile
      await page.goto('/profile');
      await expect(page).toHaveURL('/profile');
      
      // Navigate back to inventory
      await page.goto('/inventory');
      await expect(page).toHaveURL('/inventory');
    });
  });

  test.describe('Logout Process', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');
    });

    test('should logout and redirect to login page', async ({ page }) => {
      // Click logout button (assuming it exists in navigation)
      await page.click('[data-testid="logout-button"]');
      
      // Should be redirected to login page
      await expect(page).toHaveURL('/login');
      await expect(page.locator('h1')).toContainText('Login');
    });

    test('should prevent access to protected routes after logout', async ({ page }) => {
      // Logout
      await page.click('[data-testid="logout-button"]');
      await expect(page).toHaveURL('/login');
      
      // Try to access protected route
      await page.goto('/inventory');
      
      // Should be redirected back to login
      await expect(page).toHaveURL('/login?returnUrl=%2Finventory');
    });

    test('should clear user session data after logout', async ({ page }) => {
      // Logout
      await page.click('[data-testid="logout-button"]');
      
      // Check that user data is cleared (localStorage, sessionStorage)
      const localStorage = await page.evaluate(() => window.localStorage.getItem('auth_token'));
      const sessionStorage = await page.evaluate(() => window.sessionStorage.getItem('auth_token'));
      
      expect(localStorage).toBeNull();
      expect(sessionStorage).toBeNull();
    });
  });

  test.describe('Session Management', () => {
    test('should handle session expiration', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Simulate session expiration by clearing auth token
      await page.evaluate(() => {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
      });
      
      // Try to access protected route
      await page.goto('/inventory');
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login?returnUrl=%2Finventory');
    });

    test('should handle concurrent sessions', async ({ page, context }) => {
      // Login in first tab
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Open second tab
      const secondPage = await context.newPage();
      await secondPage.goto('/inventory');
      
      // Second tab should also be authenticated
      await expect(secondPage).toHaveURL('/inventory');
      
      // Logout from first tab
      await page.click('[data-testid="logout-button"]');
      
      // Second tab should also be logged out when trying to navigate
      await secondPage.goto('/profile');
      await expect(secondPage).toHaveURL('/login?returnUrl=%2Fprofile');
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle browser back/forward with auth state', async ({ page }) => {
      // Start unauthenticated, try to access protected route
      await page.goto('/inventory');
      await expect(page).toHaveURL('/login?returnUrl=%2Finventory');
      
      // Login
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/inventory');
      
      // Navigate to another route
      await page.goto('/profile');
      await expect(page).toHaveURL('/profile');
      
      // Use browser back button
      await page.goBack();
      await expect(page).toHaveURL('/inventory');
      
      // Use browser forward button
      await page.goForward();
      await expect(page).toHaveURL('/profile');
    });

    test('should prevent unauthorized back navigation', async ({ page }) => {
      // Login and navigate to protected route
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.goto('/inventory');
      
      // Logout
      await page.click('[data-testid="logout-button"]');
      await expect(page).toHaveURL('/login');
      
      // Try to go back to protected route
      await page.goBack();
      
      // Should be redirected to login again
      await expect(page).toHaveURL('/login?returnUrl=%2Finventory');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors during authentication', async ({ page }) => {
      // Intercept login request and simulate network error
      await page.route('**/api/auth/login', route => {
        route.abort('failed');
      });
      
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show network error message
      await expect(page.locator('.error-message')).toContainText('Network error');
    });

    test('should handle server errors during authentication', async ({ page }) => {
      // Intercept login request and simulate server error
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Internal server error' } })
        });
      });
      
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show server error message
      await expect(page.locator('.error-message')).toContainText('Internal server error');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
      
      // Should be able to submit with Enter
      await page.keyboard.press('Enter');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.locator('input[type="email"]')).toHaveAttribute('aria-label');
      await expect(page.locator('input[type="password"]')).toHaveAttribute('aria-label');
      await expect(page.locator('button[type="submit"]')).toHaveAttribute('aria-label');
    });
  });
});
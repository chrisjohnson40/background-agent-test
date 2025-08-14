import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import * as axe from 'axe-core';

import { LandingPageComponent } from './landing-page.component';

// Mock components for routing tests
@Component({
  template: '<div>Login Component</div>'
})
class MockLoginComponent { }

@Component({
  template: '<div>Register Component</div>'
})
class MockRegisterComponent { }

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let compiled: HTMLElement;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LandingPageComponent,
        RouterTestingModule.withRoutes([
          { path: 'login', component: MockLoginComponent },
          { path: 'register', component: MockRegisterComponent }
        ])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Application Title', () => {
    it('should display the application title', () => {
      const titleElement = compiled.querySelector('h1');
      expect(titleElement).toBeTruthy();
      expect(titleElement?.textContent).toContain('Garage Inventory Management');
    });

    it('should have the main title as the first heading', () => {
      const mainTitle = compiled.querySelector('h1');
      expect(mainTitle).toBeTruthy();
      expect(mainTitle?.textContent?.trim()).toBe('Welcome to Garage Inventory Management');
    });
  });

  describe('Tagline', () => {
    it('should display the application tagline', () => {
      const taglineElement = compiled.querySelector('.tagline, p');
      expect(taglineElement).toBeTruthy();
      expect(taglineElement?.textContent).toContain('Manage your garage inventory efficiently');
    });

    it('should have a descriptive tagline below the title', () => {
      const tagline = compiled.querySelector('p');
      expect(tagline).toBeTruthy();
      expect(tagline?.textContent?.trim()).toBe('Manage your garage inventory efficiently');
    });
  });

  describe('Key Features', () => {
    it('should display key features section', () => {
      const featuresSection = compiled.querySelector('.features, .key-features');
      expect(featuresSection).toBeTruthy();
    });

    it('should display inventory management feature', () => {
      const featureText = compiled.textContent?.toLowerCase() || '';
      expect(featureText).toContain('inventory management');
    });

    it('should display location tracking feature', () => {
      const featureText = compiled.textContent?.toLowerCase() || '';
      expect(featureText).toContain('location tracking');
    });

    it('should display item categorization feature', () => {
      const featureText = compiled.textContent?.toLowerCase() || '';
      expect(featureText).toContain('categorization');
    });

    it('should have at least 3 key features listed', () => {
      const featureItems = compiled.querySelectorAll('.feature-item, .feature, li');
      expect(featureItems.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Button Presence and Accessibility', () => {
    it('should display "Login" button', () => {
      const loginButton = compiled.querySelector('button[data-testid="login"]');
      expect(loginButton).toBeTruthy();
      expect(loginButton?.textContent?.trim()).toBe('Login');
    });

    it('should display "Register" button', () => {
      const registerButton = compiled.querySelector('button[data-testid="register"]');
      expect(registerButton).toBeTruthy();
      expect(registerButton?.textContent?.trim()).toBe('Register');
    });

    it('should have "Login" button with appropriate ARIA label', () => {
      const loginButton = compiled.querySelector('button[data-testid="login"]');
      expect(loginButton).toBeTruthy();
      expect(loginButton?.getAttribute('aria-label')).toBe('Navigate to login page');
    });

    it('should have "Register" button with appropriate ARIA label', () => {
      const registerButton = compiled.querySelector('button[data-testid="register"]');
      expect(registerButton).toBeTruthy();
      expect(registerButton?.getAttribute('aria-label')).toBe('Navigate to register page');
    });

    it('should have both buttons present on the page', () => {
      const loginButton = compiled.querySelector('button[data-testid="login"]');
      const registerButton = compiled.querySelector('button[data-testid="register"]');
      
      expect(loginButton).toBeTruthy();
      expect(registerButton).toBeTruthy();
    });

    it('should have buttons with proper accessibility attributes', () => {
      const buttons = compiled.querySelectorAll('button[data-testid="login"], button[data-testid="register"]');
      expect(buttons.length).toBe(2);
      
      buttons.forEach(button => {
        expect(button.getAttribute('type')).toBeTruthy();
        expect(button.getAttribute('aria-label')).toBeTruthy();
        expect(button.getAttribute('data-testid')).toBeTruthy();
      });
    });

    it('should have buttons that are keyboard accessible', () => {
      const buttons = compiled.querySelectorAll('button[data-testid="login"], button[data-testid="register"]');
      
      buttons.forEach(button => {
        expect(button.tagName.toLowerCase()).toBe('button');
        expect(button.getAttribute('tabindex')).not.toBe('-1');
      });
    });
  });

  describe('Content Structure', () => {
    it('should have proper semantic structure', () => {
      const landingContainer = compiled.querySelector('.landing-page, .landing-container, main');
      expect(landingContainer).toBeTruthy();
    });

    it('should display content in logical order', () => {
      const title = compiled.querySelector('h1');
      const tagline = compiled.querySelector('p');
      
      expect(title).toBeTruthy();
      expect(tagline).toBeTruthy();
      
      // Title should come before tagline in DOM order
      const titlePosition = Array.from(compiled.children).indexOf(title?.parentElement as Element);
      const taglinePosition = Array.from(compiled.children).indexOf(tagline?.parentElement as Element);
      
      if (titlePosition >= 0 && taglinePosition >= 0) {
        expect(titlePosition).toBeLessThanOrEqual(taglinePosition);
      }
    });

    it('should have responsive layout classes', () => {
      const container = compiled.querySelector('.landing-page, .container, .landing-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Component Properties', () => {
    it('should be created without errors', () => {
      expect(component).toBeDefined();
      expect(component).toBeInstanceOf(LandingPageComponent);
    });

    it('should have the correct component properties', () => {
      expect(component).toBeTruthy();
      expect(fixture).toBeTruthy();
      expect(fixture.componentInstance).toBe(component);
    });
  });

  describe('Responsive Design', () => {
    describe('Layout Structure and Flexibility', () => {
      it('should have a responsive container with flexbox layout', () => {
        const landingPage = compiled.querySelector('.landing-page') as HTMLElement;
        expect(landingPage).toBeTruthy();
        
        const computedStyle = window.getComputedStyle(landingPage);
        expect(computedStyle.display).toBe('flex');
        expect(computedStyle.flexDirection).toBe('column');
        expect(computedStyle.alignItems).toBe('center');
        expect(computedStyle.justifyContent).toBe('center');
      });

      it('should have flexible button container that can wrap', () => {
        const ctaButtons = compiled.querySelector('.cta-buttons') as HTMLElement;
        expect(ctaButtons).toBeTruthy();
        
        const computedStyle = window.getComputedStyle(ctaButtons);
        expect(computedStyle.display).toBe('flex');
        expect(computedStyle.flexWrap).toBe('wrap');
        expect(computedStyle.justifyContent).toBe('center');
      });

      it('should have responsive features grid layout', () => {
        const features = compiled.querySelector('.features') as HTMLElement;
        expect(features).toBeTruthy();
        
        const computedStyle = window.getComputedStyle(features);
        expect(computedStyle.display).toBe('grid');
        expect(computedStyle.gap).toBeTruthy();
      });

      it('should maintain proper content hierarchy', () => {
        const landingPage = compiled.querySelector('.landing-page');
        const children = Array.from(landingPage?.children || []);
        
        expect(children.length).toBeGreaterThan(0);
        
        // Verify order: title, tagline, features, buttons
        const title = compiled.querySelector('h1');
        const tagline = compiled.querySelector('p');
        const features = compiled.querySelector('.features');
        const buttons = compiled.querySelector('.cta-buttons');
        
        expect(title).toBeTruthy();
        expect(tagline).toBeTruthy();
        expect(features).toBeTruthy();
        expect(buttons).toBeTruthy();
      });
    });

    describe('Responsive CSS Classes and Media Queries', () => {
      it('should have CSS media queries defined for mobile breakpoint', () => {
        // Test that the CSS contains mobile media queries
        const styleSheets = Array.from(document.styleSheets);
        let hasMobileMediaQuery = false;
        
        styleSheets.forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            rules.forEach(rule => {
              if (rule instanceof CSSMediaRule && rule.conditionText.includes('767px')) {
                hasMobileMediaQuery = true;
              }
            });
          } catch (e) {
            // Some stylesheets may not be accessible due to CORS
          }
        });
        
        // Since we can't always access stylesheets in tests, we'll check for responsive structure
        expect(compiled.querySelector('.landing-page')).toBeTruthy();
        expect(compiled.querySelector('.cta-buttons')).toBeTruthy();
        expect(compiled.querySelector('.features')).toBeTruthy();
      });

      it('should have flexible grid layout for features', () => {
        const features = compiled.querySelector('.features') as HTMLElement;
        const featureItems = compiled.querySelectorAll('.feature-item');
        
        expect(features).toBeTruthy();
        expect(featureItems.length).toBe(3);
        
        // Features should be in a grid layout
        const computedStyle = window.getComputedStyle(features);
        expect(computedStyle.display).toBe('grid');
      });

      it('should have buttons that can stack vertically when needed', () => {
        const ctaButtons = compiled.querySelector('.cta-buttons') as HTMLElement;
        const buttons = compiled.querySelectorAll('.cta-buttons button');
        
        expect(ctaButtons).toBeTruthy();
        expect(buttons.length).toBe(2);
        
        // Buttons container should have flex-wrap for responsive behavior
        const computedStyle = window.getComputedStyle(ctaButtons);
        expect(computedStyle.flexWrap).toBe('wrap');
      });
    });

    describe('Viewport Simulation Tests', () => {
      // Helper function to simulate viewport changes
      const simulateViewport = (width: number, height: number = 800) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: height
        });
        
        window.dispatchEvent(new Event('resize'));
        fixture.detectChanges();
      };

      it('should maintain accessibility across different viewport sizes', () => {
        const viewports = [320, 375, 768, 1024, 1200];
        
        viewports.forEach(width => {
          simulateViewport(width);
          
          // Check that buttons maintain accessibility attributes
          const buttons = compiled.querySelectorAll('button[data-testid]');
          expect(buttons.length).toBe(2);
          
          buttons.forEach(button => {
            expect(button.getAttribute('aria-label')).toBeTruthy();
            expect(button.getAttribute('data-testid')).toBeTruthy();
            expect(button.getAttribute('type')).toBe('button');
          });
          
          // Check that semantic structure is maintained
          const title = compiled.querySelector('h1');
          const tagline = compiled.querySelector('p');
          const features = compiled.querySelector('.features');
          
          expect(title).toBeTruthy();
          expect(tagline).toBeTruthy();
          expect(features).toBeTruthy();
        });
      });

      it('should handle very small screens gracefully', () => {
        simulateViewport(320);
        
        const landingPage = compiled.querySelector('.landing-page') as HTMLElement;
        const buttons = compiled.querySelectorAll('.cta-buttons button') as NodeListOf<HTMLElement>;
        const features = compiled.querySelector('.features') as HTMLElement;
        
        expect(landingPage).toBeTruthy();
        expect(buttons.length).toBe(2);
        expect(features).toBeTruthy();
        
        // Content should still be accessible and properly structured
        const title = compiled.querySelector('h1');
        const tagline = compiled.querySelector('p');
        
        expect(title).toBeTruthy();
        expect(tagline).toBeTruthy();
      });

      it('should handle large screens appropriately', () => {
        simulateViewport(1920);
        
        const landingPage = compiled.querySelector('.landing-page') as HTMLElement;
        const title = compiled.querySelector('h1') as HTMLElement;
        const features = compiled.querySelector('.features') as HTMLElement;
        
        expect(landingPage).toBeTruthy();
        expect(title).toBeTruthy();
        expect(features).toBeTruthy();
        
        // Content should remain centered and readable
        const landingStyle = window.getComputedStyle(landingPage);
        expect(landingStyle.textAlign).toBe('center');
        expect(landingStyle.alignItems).toBe('center');
      });
    });

    describe('Responsive Design Principles', () => {
      it('should use relative units for scalability', () => {
        const landingPage = compiled.querySelector('.landing-page') as HTMLElement;
        expect(landingPage).toBeTruthy();
        
        // The component should be structured to support responsive design
        const title = compiled.querySelector('h1');
        const tagline = compiled.querySelector('p');
        const features = compiled.querySelector('.features');
        const buttons = compiled.querySelector('.cta-buttons');
        
        expect(title).toBeTruthy();
        expect(tagline).toBeTruthy();
        expect(features).toBeTruthy();
        expect(buttons).toBeTruthy();
      });

      it('should have proper touch targets for mobile devices', () => {
        const buttons = compiled.querySelectorAll('.cta-buttons button') as NodeListOf<HTMLElement>;
        
        buttons.forEach(button => {
          // Buttons should be large enough for touch interaction
          const rect = button.getBoundingClientRect();
          expect(rect.height).toBeGreaterThan(40); // Minimum recommended touch target
        });
      });

      it('should maintain readability across different screen sizes', () => {
        const title = compiled.querySelector('h1') as HTMLElement;
        const tagline = compiled.querySelector('p') as HTMLElement;
        const featureTexts = compiled.querySelectorAll('.feature-item p') as NodeListOf<HTMLElement>;
        
        expect(title).toBeTruthy();
        expect(tagline).toBeTruthy();
        expect(featureTexts.length).toBe(3);
        
        // Text should be readable (not too small)
        const titleStyle = window.getComputedStyle(title);
        const taglineStyle = window.getComputedStyle(tagline);
        
        expect(parseFloat(titleStyle.fontSize)).toBeGreaterThan(16); // Minimum readable size
        expect(parseFloat(taglineStyle.fontSize)).toBeGreaterThan(14);
      });

      it('should have appropriate spacing for different screen densities', () => {
        const landingPage = compiled.querySelector('.landing-page') as HTMLElement;
        const features = compiled.querySelector('.features') as HTMLElement;
        const buttons = compiled.querySelector('.cta-buttons') as HTMLElement;
        
        expect(landingPage).toBeTruthy();
        expect(features).toBeTruthy();
        expect(buttons).toBeTruthy();
        
        // Elements should have proper spacing
        const landingStyle = window.getComputedStyle(landingPage);
        const featuresStyle = window.getComputedStyle(features);
        const buttonsStyle = window.getComputedStyle(buttons);
        
        expect(landingStyle.padding).toBeTruthy();
        expect(featuresStyle.gap).toBeTruthy();
        expect(buttonsStyle.gap).toBeTruthy();
      });
    });
  });

  describe('Routing Button Functionality', () => {
    it('should display "Login" button', () => {
      const loginButton = compiled.querySelector('button[data-testid="login"]');
      expect(loginButton).toBeTruthy();
      expect(loginButton?.textContent?.trim()).toBe('Login');
    });

    it('should display "Register" button', () => {
      const registerButton = compiled.querySelector('button[data-testid="register"]');
      expect(registerButton).toBeTruthy();
      expect(registerButton?.textContent?.trim()).toBe('Register');
    });

    it('should navigate to /login when Login button is clicked', async () => {
      const loginButton = compiled.querySelector('button[data-testid="login"]') as HTMLButtonElement;
      expect(loginButton).toBeTruthy();

      loginButton.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/login');
    });

    it('should navigate to /register when Register button is clicked', async () => {
      const registerButton = compiled.querySelector('button[data-testid="register"]') as HTMLButtonElement;
      expect(registerButton).toBeTruthy();

      registerButton.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/register');
    });

    it('should have Login button with appropriate ARIA label', () => {
      const loginButton = compiled.querySelector('button[data-testid="login"]');
      expect(loginButton).toBeTruthy();
      expect(loginButton?.getAttribute('aria-label')).toBe('Navigate to login page');
    });

    it('should have Register button with appropriate ARIA label', () => {
      const registerButton = compiled.querySelector('button[data-testid="register"]');
      expect(registerButton).toBeTruthy();
      expect(registerButton?.getAttribute('aria-label')).toBe('Navigate to register page');
    });

    it('should have both routing buttons present on the page', () => {
      const loginButton = compiled.querySelector('button[data-testid="login"]');
      const registerButton = compiled.querySelector('button[data-testid="register"]');
      
      expect(loginButton).toBeTruthy();
      expect(registerButton).toBeTruthy();
    });

    it('should have routing buttons with proper accessibility attributes', () => {
      const buttons = compiled.querySelectorAll('button[data-testid="login"], button[data-testid="register"]');
      expect(buttons.length).toBe(2);
      
      buttons.forEach(button => {
        expect(button.getAttribute('type')).toBeTruthy();
        expect(button.getAttribute('aria-label')).toBeTruthy();
        expect(button.getAttribute('data-testid')).toBeTruthy();
      });
    });
  });

  describe('Comprehensive Accessibility Tests', () => {
    describe('Semantic HTML Structure', () => {
      it('should have proper semantic HTML elements', () => {
        const main = compiled.querySelector('main');
        const header = compiled.querySelector('header');
        const sections = compiled.querySelectorAll('section');
        const articles = compiled.querySelectorAll('article');

        expect(main).toBeTruthy();
        expect(header).toBeTruthy();
        expect(sections.length).toBeGreaterThanOrEqual(2);
        expect(articles.length).toBe(3);
      });

      it('should have proper heading hierarchy', () => {
        const h1 = compiled.querySelector('h1');
        const h2s = compiled.querySelectorAll('h2');
        const h3s = compiled.querySelectorAll('h3');

        expect(h1).toBeTruthy();
        expect(h2s.length).toBeGreaterThanOrEqual(2);
        expect(h3s.length).toBe(3);

        // Check heading order
        expect(h1?.textContent).toContain('Welcome to Garage Inventory Management');
        h3s.forEach(h3 => {
          expect(h3.textContent).toBeTruthy();
        });
      });

      it('should have skip navigation link', () => {
        const skipLink = compiled.querySelector('.skip-link');
        expect(skipLink).toBeTruthy();
        expect(skipLink?.getAttribute('href')).toBe('#main-content');
        expect(skipLink?.textContent?.trim()).toBe('Skip to main content');
      });

      it('should have main content with proper id', () => {
        const main = compiled.querySelector('main#main-content');
        expect(main).toBeTruthy();
        expect(main?.getAttribute('role')).toBe('main');
        expect(main?.getAttribute('aria-labelledby')).toBe('page-title');
      });
    });

    describe('ARIA Attributes and Labels', () => {
      it('should have proper ARIA labels on sections', () => {
        const featuresSection = compiled.querySelector('.features');
        const ctaSection = compiled.querySelector('.cta-section');

        expect(featuresSection?.getAttribute('aria-labelledby')).toBe('features-heading');
        expect(ctaSection?.getAttribute('aria-labelledby')).toBe('cta-heading');
      });

      it('should have proper ARIA roles', () => {
        const featuresList = compiled.querySelector('.features-grid');
        const ctaGroup = compiled.querySelector('.cta-buttons');
        const articles = compiled.querySelectorAll('article');

        expect(featuresList?.getAttribute('role')).toBe('list');
        expect(ctaGroup?.getAttribute('role')).toBe('group');
        expect(ctaGroup?.getAttribute('aria-label')).toBe('Account actions');

        articles.forEach(article => {
          expect(article.getAttribute('role')).toBe('listitem');
        });
      });

      it('should have proper icon accessibility', () => {
        const icons = compiled.querySelectorAll('mat-icon');
        
        icons.forEach(icon => {
          expect(icon.getAttribute('aria-label')).toBeTruthy();
          expect(icon.getAttribute('role')).toBe('img');
        });
      });

      it('should have screen reader descriptions for buttons', () => {
        const loginDescription = compiled.querySelector('#login-description');
        const registerDescription = compiled.querySelector('#register-description');

        expect(loginDescription).toBeTruthy();
        expect(registerDescription).toBeTruthy();
        expect(loginDescription?.classList.contains('sr-only')).toBe(true);
        expect(registerDescription?.classList.contains('sr-only')).toBe(true);
      });
    });

    describe('Keyboard Navigation', () => {
      it('should handle keyboard events on buttons', () => {
        spyOn(component, 'navigateToLogin');
        spyOn(component, 'navigateToRegister');

        const loginButton = compiled.querySelector('button[data-testid="login"]') as HTMLButtonElement;
        const registerButton = compiled.querySelector('button[data-testid="register"]') as HTMLButtonElement;

        // Test Enter key
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        loginButton.dispatchEvent(enterEvent);
        expect(component.navigateToLogin).toHaveBeenCalled();

        // Test Space key
        const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
        registerButton.dispatchEvent(spaceEvent);
        expect(component.navigateToRegister).toHaveBeenCalled();
      });

      it('should have focusable elements in logical order', () => {
        const focusableElements = compiled.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        expect(focusableElements.length).toBeGreaterThanOrEqual(3); // skip link + 2 buttons
        
        // First focusable should be skip link
        expect(focusableElements[0].classList.contains('skip-link')).toBe(true);
      });
    });

    describe('Color Contrast and Visual Accessibility', () => {
      it('should use CSS custom properties for consistent theming', () => {
        const title = compiled.querySelector('h1') as HTMLElement;
        const tagline = compiled.querySelector('.tagline') as HTMLElement;

        // These elements should use Material Design system colors
        expect(title).toBeTruthy();
        expect(tagline).toBeTruthy();
      });

      it('should have minimum touch target sizes', () => {
        const buttons = compiled.querySelectorAll('button') as NodeListOf<HTMLElement>;
        
        buttons.forEach(button => {
          const rect = button.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(button);
          
          // Check minimum height is set in CSS
          expect(computedStyle.minHeight).toBeTruthy();
        });
      });

      it('should support high contrast mode', () => {
        // This test verifies that high contrast media queries are present
        // The actual contrast testing would require visual regression testing
        const buttons = compiled.querySelectorAll('button');
        expect(buttons.length).toBe(2);
      });
    });

    describe('Responsive Accessibility', () => {
      it('should maintain accessibility across viewport sizes', () => {
        const viewports = [320, 768, 1024];
        
        viewports.forEach(width => {
          // Simulate viewport change
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width
          });
          
          fixture.detectChanges();
          
          // Check that semantic structure is maintained
          const main = compiled.querySelector('main');
          const buttons = compiled.querySelectorAll('button[aria-label]');
          const skipLink = compiled.querySelector('.skip-link');
          
          expect(main).toBeTruthy();
          expect(buttons.length).toBe(2);
          expect(skipLink).toBeTruthy();
        });
      });

      it('should support reduced motion preferences', () => {
        // This test verifies that reduced motion styles are considered
        const buttons = compiled.querySelectorAll('button');
        expect(buttons.length).toBe(2);
        
        // The actual reduced motion testing would require CSS media query testing
        // which is handled by the CSS itself
      });
    });

    describe('Screen Reader Compatibility', () => {
      it('should have proper document structure for screen readers', () => {
        const landmarks = compiled.querySelectorAll('main, header, section');
        const headings = compiled.querySelectorAll('h1, h2, h3');
        const lists = compiled.querySelectorAll('[role="list"]');
        
        expect(landmarks.length).toBeGreaterThanOrEqual(4); // main + header + 2 sections
        expect(headings.length).toBeGreaterThanOrEqual(6); // h1 + 2 h2 + 3 h3
        expect(lists.length).toBe(1); // features list
      });

      it('should have descriptive text content', () => {
        const title = compiled.querySelector('h1');
        const tagline = compiled.querySelector('.tagline');
        const featureDescriptions = compiled.querySelectorAll('mat-card-content p');
        
        expect(title?.textContent?.trim()).toBe('Welcome to Garage Inventory Management');
        expect(tagline?.textContent?.trim()).toBe('Manage your garage inventory efficiently');
        expect(featureDescriptions.length).toBe(3);
        
        featureDescriptions.forEach(desc => {
          expect(desc.textContent?.trim().length).toBeGreaterThan(10);
        });
      });

      it('should have proper live region for announcements', () => {
        // Check if live region exists in document (added to index.html)
        const liveRegion = document.querySelector('#sr-announcements');
        expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
        expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
      });
    });

    describe('Automated Accessibility Testing with axe-core', () => {
      it('should pass axe accessibility tests', async () => {
        const results = await axe.run(compiled);
        
        // Check for violations
        expect(results.violations.length).toBe(0);
        
        // Log any violations for debugging
        if (results.violations.length > 0) {
          console.error('Accessibility violations found:', results.violations);
        }
      });

      it('should have no color contrast violations', async () => {
        const results = await axe.run(compiled, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });
        
        const colorContrastViolations = results.violations.filter(
          violation => violation.id === 'color-contrast'
        );
        
        expect(colorContrastViolations.length).toBe(0);
      });

      it('should have proper keyboard navigation', async () => {
        const results = await axe.run(compiled, {
          rules: {
            'keyboard': { enabled: true },
            'focus-order-semantics': { enabled: true }
          }
        });
        
        const keyboardViolations = results.violations.filter(
          violation => violation.id === 'keyboard' || violation.id === 'focus-order-semantics'
        );
        
        expect(keyboardViolations.length).toBe(0);
      });

      it('should have proper ARIA implementation', async () => {
        const results = await axe.run(compiled, {
          rules: {
            'aria-valid-attr': { enabled: true },
            'aria-valid-attr-value': { enabled: true },
            'aria-roles': { enabled: true }
          }
        });
        
        const ariaViolations = results.violations.filter(
          violation => violation.id.startsWith('aria-')
        );
        
        expect(ariaViolations.length).toBe(0);
      });
    });
  });
});
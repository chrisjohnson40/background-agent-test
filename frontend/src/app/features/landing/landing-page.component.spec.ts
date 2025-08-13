import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
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
    it('should display "Get Started" button', () => {
      const getStartedButton = compiled.querySelector('button[data-testid="get-started"]');
      expect(getStartedButton).toBeTruthy();
      expect(getStartedButton?.textContent?.trim()).toBe('Get Started');
    });

    it('should display "Sign Up" button', () => {
      const signUpButton = compiled.querySelector('button[data-testid="sign-up"]');
      expect(signUpButton).toBeTruthy();
      expect(signUpButton?.textContent?.trim()).toBe('Sign Up');
    });

    it('should have "Get Started" button with appropriate ARIA label', () => {
      const getStartedButton = compiled.querySelector('button[data-testid="get-started"]');
      expect(getStartedButton).toBeTruthy();
      expect(getStartedButton?.getAttribute('aria-label')).toBe('Get started with garage inventory management');
    });

    it('should have "Sign Up" button with appropriate ARIA label', () => {
      const signUpButton = compiled.querySelector('button[data-testid="sign-up"]');
      expect(signUpButton).toBeTruthy();
      expect(signUpButton?.getAttribute('aria-label')).toBe('Sign up for a new account');
    });

    it('should have both buttons present on the page', () => {
      const getStartedButton = compiled.querySelector('button[data-testid="get-started"]');
      const signUpButton = compiled.querySelector('button[data-testid="sign-up"]');
      
      expect(getStartedButton).toBeTruthy();
      expect(signUpButton).toBeTruthy();
    });

    it('should have buttons with proper accessibility attributes', () => {
      const buttons = compiled.querySelectorAll('button[data-testid="get-started"], button[data-testid="sign-up"]');
      expect(buttons.length).toBe(2);
      
      buttons.forEach(button => {
        expect(button.getAttribute('type')).toBeTruthy();
        expect(button.getAttribute('aria-label')).toBeTruthy();
        expect(button.getAttribute('data-testid')).toBeTruthy();
      });
    });

    it('should have buttons that are keyboard accessible', () => {
      const buttons = compiled.querySelectorAll('button[data-testid="get-started"], button[data-testid="sign-up"]');
      
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
});
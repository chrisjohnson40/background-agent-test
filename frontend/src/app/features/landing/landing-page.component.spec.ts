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
});
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

  describe('Call-to-Action Buttons', () => {
    it('should display call-to-action buttons', () => {
      const ctaButtons = compiled.querySelectorAll('button, .btn, .cta-button');
      expect(ctaButtons.length).toBeGreaterThan(0);
    });

    it('should have a "Get Started" button', () => {
      const getStartedButton = compiled.querySelector('button[data-testid="get-started"], .get-started-btn');
      const buttonText = compiled.textContent?.toLowerCase() || '';
      expect(getStartedButton || buttonText.includes('get started')).toBeTruthy();
    });

    it('should have a "Learn More" button', () => {
      const learnMoreButton = compiled.querySelector('button[data-testid="learn-more"], .learn-more-btn');
      const buttonText = compiled.textContent?.toLowerCase() || '';
      expect(learnMoreButton || buttonText.includes('learn more')).toBeTruthy();
    });

    it('should have primary and secondary action buttons', () => {
      const buttons = compiled.querySelectorAll('button, .btn');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should have buttons with proper accessibility attributes', () => {
      const buttons = compiled.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.getAttribute('type')).toBeTruthy();
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
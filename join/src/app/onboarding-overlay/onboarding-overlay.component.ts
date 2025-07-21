import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingService, OnboardingStep } from '../shared/services/onboarding.service';
import { AuthService } from '../shared/services/auth.service';
import { Subscription } from 'rxjs';
/**
 * Onboarding overlay component that guides new users through the application.
 * Shows step-by-step instructions for each main navigation item.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-onboarding-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-overlay.component.html',
  styleUrl: './onboarding-overlay.component.scss'
})
export class OnboardingOverlayComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('overlayContainer', { static: false }) overlayContainer!: ElementRef;

  showOnboarding = false;
  currentStep: OnboardingStep | null = null;
  currentStepNumber = 1;
  totalSteps = 4;
  highlightPosition = { top: '0px', left: '0px', width: '0px', height: '0px' };
  private subscriptions: Subscription[] = [];
  constructor(
    private onboardingService: OnboardingService,
    private authService: AuthService
  ) {}
  /**
   * Angular lifecycle hook - initializes the component.
   */
  ngOnInit(): void {
    this.subscribeToOnboarding();
  }

  /**
   * Angular lifecycle hook - runs after view initialization.
   */
  ngAfterViewInit(): void {
    this.updateHighlightPosition();
  }

  /**
   * Angular lifecycle hook - cleans up subscriptions on component destruction.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Handles window resize events to update highlight position.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (this.showOnboarding) {
      setTimeout(() => this.updateHighlightPosition(), 100);
    }
  }

  /**
   * Subscribes to onboarding service observables.
   */
  private subscribeToOnboarding(): void {
    const showSub = this.onboardingService.showOnboarding$.subscribe(show => {
      this.showOnboarding = show;
      if (show) {
        setTimeout(() => this.updateHighlightPosition(), 100);
      }
    });
    const stepSub = this.onboardingService.currentStep$.subscribe(() => {
      this.currentStep = this.onboardingService.getCurrentStep();
      this.currentStepNumber = this.onboardingService.getCurrentStepNumber();
      this.totalSteps = this.onboardingService.getTotalSteps();
      if (this.showOnboarding) {
        setTimeout(() => this.updateHighlightPosition(), 100);
      }
    });

    this.subscriptions.push(showSub, stepSub);
  }

  /**
   * Updates the position of the highlight around the target element.
   */
  private updateHighlightPosition(): void {
    if (!this.currentStep || !this.showOnboarding) return;
    const targetElement = document.querySelector(this.currentStep.targetElementSelector);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const padding = 8;
      this.highlightPosition = {
        top: `${rect.top - padding}px`,
        left: `${rect.left - padding}px`,
        width: `${rect.width + (padding * 2)}px`,

        height: `${rect.height + (padding * 2)}px`
      };
    } else {
      this.highlightPosition = {
        top: '0px', left: '0px', width: '0px', height: '0px'
      };
    }
  }

  /**
   * Gets the position styles for the tooltip.
   */
  getTooltipPosition(): { [key: string]: string } {
    if (!this.currentStep) return {};
    const targetElement = document.querySelector(this.currentStep.targetElementSelector);
    if (!targetElement) return {};
    const rect = targetElement.getBoundingClientRect();
    const tooltipOffset = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 300;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (viewportWidth < 1000) {
      return {
        'top': '50%', 'left': '50%', 'transform': 'translate(-50%, -50%)', 'position': 'fixed'
      };
    }
    let position: { [key: string]: string } = {};
    switch (this.currentStep.position) {
      case 'right':
        if (rect.right + tooltipOffset + tooltipWidth > viewportWidth) {
          position = {
            'top': `${rect.top + (rect.height / 2)}px`,

            'right': `${viewportWidth - rect.left + tooltipOffset}px`,
            'transform': 'translateY(-50%)'
          };
        } else {
          position = {
            'top': `${rect.top + (rect.height / 2)}px`,

            'left': `${rect.right + tooltipOffset}px`,
            'transform': 'translateY(-50%)'
          };
        }
        break;
      case 'left':
        if (rect.left - tooltipOffset - tooltipWidth < 0) {
          position = {
            'top': `${rect.top + (rect.height / 2)}px`,

            'left': `${rect.right + tooltipOffset}px`,
            'transform': 'translateY(-50%)'
          };
        } else {
          position = {
            'top': `${rect.top + (rect.height / 2)}px`,

            'right': `${viewportWidth - rect.left + tooltipOffset}px`,
            'transform': 'translateY(-50%)'
          };
        }
        break;
      case 'top':
        if (rect.top - tooltipOffset - tooltipHeight < 0) {
          position = {
            'top': `${rect.bottom + tooltipOffset}px`,
            'left': `${Math.min(rect.left + (rect.width / 2), viewportWidth - tooltipWidth/2)}px`,

            'transform': 'translateX(-50%)'
          };
        } else {
          position = {
            'bottom': `${viewportHeight - rect.top + tooltipOffset}px`,
            'left': `${Math.min(rect.left + (rect.width / 2), viewportWidth - tooltipWidth/2)}px`,

            'transform': 'translateX(-50%)'
          };
        }
        break;
      case 'bottom':
        if (rect.bottom + tooltipOffset + tooltipHeight > viewportHeight) {
          position = {
            'bottom': `${viewportHeight - rect.top + tooltipOffset}px`,
            'left': `${Math.min(rect.left + (rect.width / 2), viewportWidth - tooltipWidth/2)}px`,

            'transform': 'translateX(-50%)'
          };
        } else {
          position = {
            'top': `${rect.bottom + tooltipOffset}px`,
            'left': `${Math.min(rect.left + (rect.width / 2), viewportWidth - tooltipWidth/2)}px`,

            'transform': 'translateX(-50%)'
          };
        }
        break;
      case 'center':
        position = {
          'top': '50%', 'left': '50%', 'transform': 'translate(-50%, -50%)'
        };
        break;
      default:
        position = {
          'top': '50%', 'left': '50%', 'transform': 'translate(-50%, -50%)'
        };
    }
    if (position['top'] && parseInt(position['top']) < 20) {
      position['top'] = '20px';
    }
    if (position['left'] && parseInt(position['left']) < 20) {
      position['left'] = '20px';
    }
    return position;
  }

  /**
   * Gets the arrow direction class for the tooltip.
   */
  getArrowClass(): string {
    if (!this.currentStep) return '';
    switch (this.currentStep.position) {
      case 'right': return 'arrow-left';
      case 'left': return 'arrow-right';
      case 'top': return 'arrow-down';
      case 'bottom': return 'arrow-up';
      default: return '';
    }
  }

  /**
   * Handles clicking the next button.
   */
  onNext(): void {
    this.onboardingService.nextStep();
  }

  /**
   * Handles clicking the previous button.
   */
  onPrevious(): void {
    this.onboardingService.previousStep();
  }

  /**
   * Handles clicking the skip button.
   */
  onSkip(): void {
    this.onboardingService.skipOnboarding();
  }

  /**
   * Handles clicking the close button.
   */
  onClose(): void {
    this.onboardingService.skipOnboarding();
  }

  /**
   * Checks if it's the first step.
   */
  isFirstStep(): boolean {
    return this.onboardingService.isFirstStep();
  }

  /**
   * Checks if it's the last step.
   */
  isLastStep(): boolean {
    return this.onboardingService.isLastStep();
  }

  /**
   * Gets the next button text.
   */
  getNextButtonText(): string {
    return this.isLastStep() ? 'Finish' : 'Next';
  }

  /**
   * Handles clicking outside the tooltip (on the overlay).
   */
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      return;
    }
  }

  /**
   * Checks if the user is authenticated.
   */
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }
}

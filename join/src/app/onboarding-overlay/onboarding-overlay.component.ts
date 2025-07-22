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
  /**
   * Handles resize events.
   * @param event - Event parameter
   */
  onResize(event: any): void {
    if (this.showOnboarding) {
      setTimeout(() => this.updateHighlightPosition(), 100);
    }
  }

  /**
   * Subscribes to onboarding service observables.
   */
  private subscribeToOnboarding(): void {
    const showSub = this.createShowOnboardingSubscription();
    const stepSub = this.createStepChangeSubscription();
    this.subscriptions.push(showSub, stepSub);
  }

  /**
   * Creates subscription for show onboarding observable.
   * 
   * @returns Subscription for show onboarding changes
   * @private
   */
  private createShowOnboardingSubscription(): Subscription {
    return this.onboardingService.showOnboarding$.subscribe(show => {
      this.showOnboarding = show;
      if (show) {
        this.scheduleHighlightUpdate();
      }
    });
  }

  /**
   * Creates subscription for step change observable.
   * 
   * @returns Subscription for step changes
   * @private
   */
  private createStepChangeSubscription(): Subscription {
    return this.onboardingService.currentStep$.subscribe(() => {
      this.updateStepInformation();
      if (this.showOnboarding) {
        this.scheduleHighlightUpdate();
      }
    });
  }

  /**
   * Updates step information from onboarding service.
   * 
   * @private
   */
  private updateStepInformation(): void {
    this.currentStep = this.onboardingService.getCurrentStep();
    this.currentStepNumber = this.onboardingService.getCurrentStepNumber();
    this.totalSteps = this.onboardingService.getTotalSteps();
  }

  /**
   * Schedules highlight position update with timeout.
   * 
   * @private
   */
  private scheduleHighlightUpdate(): void {
    setTimeout(() => this.updateHighlightPosition(), 100);
  }

  /**
   * Updates the position of the highlight around the target element.
   */
  private updateHighlightPosition(): void {
    if (!this.shouldUpdateHighlight()) return;
    
    const targetElement = this.findTargetElement();
    if (targetElement) {
      this.setHighlightPositionFromElement(targetElement);
    } else {
      this.resetHighlightPosition();
    }
  }

  /**
   * Checks if highlight position should be updated.
   * 
   * @returns True if highlight should be updated
   * @private
   */
  private shouldUpdateHighlight(): boolean {
    return !!(this.currentStep && this.showOnboarding);
  }

  /**
   * Finds the target element for current step.
   * 
   * @returns Target element or null
   * @private
   */
  private findTargetElement(): Element | null {
    return document.querySelector(this.currentStep!.targetElementSelector);
  }

  /**
   * Sets highlight position based on target element dimensions.
   * 
   * @param targetElement - Element to highlight
   * @private
   */
  private setHighlightPositionFromElement(targetElement: Element): void {
    const rect = targetElement.getBoundingClientRect();
    const padding = 8;
    this.highlightPosition = {
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + (padding * 2)}px`,
      height: `${rect.height + (padding * 2)}px`
    };
  }

  /**
   * Resets highlight position to default values.
   * 
   * @private
   */
  private resetHighlightPosition(): void {
    this.highlightPosition = {
      top: '0px', 
      left: '0px', 
      width: '0px', 
      height: '0px'
    };
  }

  /**
   * Gets the position styles for the tooltip.
   */
  getTooltipPosition(): { [key: string]: string } {
    if (!this.currentStep) return {};
    const targetElement = document.querySelector(this.currentStep.targetElementSelector);
    if (!targetElement) return {};

    const rect = targetElement.getBoundingClientRect();
    const dimensions = this.getTooltipDimensions();
    
    if (dimensions.viewportWidth < 1000) {
      return this.getCenterPosition();
    }

    let position = this.calculatePositionByDirection(rect, dimensions);
    return this.adjustPositionForViewport(position);
  }

  /**
   * Gets tooltip dimensions and viewport information.
   */
  private getTooltipDimensions() {
    return {
      tooltipOffset: 20,
      tooltipWidth: 400,
      tooltipHeight: 300,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }

  /**
   * Returns centered position for mobile devices.
   */
  private getCenterPosition(): { [key: string]: string } {
    return {
      'top': '50%',
      'left': '50%',
      'transform': 'translate(-50%, -50%)',
      'position': 'fixed'
    };
  }

  /**
   * Calculates position based on tooltip direction.
   */
  private calculatePositionByDirection(rect: DOMRect, dimensions: any): { [key: string]: string } {
    switch (this.currentStep!.position) {
      case 'right':
        return this.getRightPosition(rect, dimensions);
      case 'left':
        return this.getLeftPosition(rect, dimensions);
      case 'top':
        return this.getTopPosition(rect, dimensions);
      case 'bottom':
        return this.getBottomPosition(rect, dimensions);
      case 'center':
        return this.getCenterPosition();
      default:
        return this.getCenterPosition();
    }
  }

  /**
   * Calculates right position for tooltip.
   */
  private getRightPosition(rect: DOMRect, dimensions: any): { [key: string]: string } {
    const { tooltipOffset, tooltipWidth, viewportWidth } = dimensions;
    const centerY = rect.top + (rect.height / 2);
    
    if (rect.right + tooltipOffset + tooltipWidth > viewportWidth) {
      return {
        'top': `${centerY}px`,
        'right': `${viewportWidth - rect.left + tooltipOffset}px`,
        'transform': 'translateY(-50%)'
      };
    } else {
      return {
        'top': `${centerY}px`,
        'left': `${rect.right + tooltipOffset}px`,
        'transform': 'translateY(-50%)'
      };
    }
  }

  /**
   * Calculates left position for tooltip.
   */
  private getLeftPosition(rect: DOMRect, dimensions: any): { [key: string]: string } {
    const { tooltipOffset, tooltipWidth, viewportWidth } = dimensions;
    const centerY = rect.top + (rect.height / 2);
    
    if (rect.left - tooltipOffset - tooltipWidth < 0) {
      return {
        'top': `${centerY}px`,
        'left': `${rect.right + tooltipOffset}px`,
        'transform': 'translateY(-50%)'
      };
    } else {
      return {
        'top': `${centerY}px`,
        'right': `${viewportWidth - rect.left + tooltipOffset}px`,
        'transform': 'translateY(-50%)'
      };
    }
  }

  /**
   * Calculates top position for tooltip.
   */
  private getTopPosition(rect: DOMRect, dimensions: any): { [key: string]: string } {
    const { tooltipOffset, tooltipHeight, tooltipWidth, viewportWidth, viewportHeight } = dimensions;
    const centerX = Math.min(rect.left + (rect.width / 2), viewportWidth - tooltipWidth/2);
    
    if (rect.top - tooltipOffset - tooltipHeight < 0) {
      return {
        'top': `${rect.bottom + tooltipOffset}px`,
        'left': `${centerX}px`,
        'transform': 'translateX(-50%)'
      };
    } else {
      return {
        'bottom': `${viewportHeight - rect.top + tooltipOffset}px`,
        'left': `${centerX}px`,
        'transform': 'translateX(-50%)'
      };
    }
  }

  /**
   * Calculates bottom position for tooltip.
   */
  private getBottomPosition(rect: DOMRect, dimensions: any): { [key: string]: string } {
    const { tooltipOffset, tooltipHeight, tooltipWidth, viewportWidth, viewportHeight } = dimensions;
    const centerX = Math.min(rect.left + (rect.width / 2), viewportWidth - tooltipWidth/2);
    
    if (rect.bottom + tooltipOffset + tooltipHeight > viewportHeight) {
      return {
        'bottom': `${viewportHeight - rect.top + tooltipOffset}px`,
        'left': `${centerX}px`,
        'transform': 'translateX(-50%)'
      };
    } else {
      return {
        'top': `${rect.bottom + tooltipOffset}px`,
        'left': `${centerX}px`,
        'transform': 'translateX(-50%)'
      };
    }
  }

  /**
   * Adjusts position to ensure tooltip stays within viewport bounds.
   */
  private adjustPositionForViewport(position: { [key: string]: string }): { [key: string]: string } {
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
    if (this.isClickOnOverlayBackground(event)) {
      this.handleOverlayBackgroundClick();
    }
  }

  /**
   * Checks if the click was on the overlay background (not on tooltip content).
   */
  private isClickOnOverlayBackground(event: MouseEvent): boolean {
    return event.target === event.currentTarget;
  }

  /**
   * Handles clicks on the overlay background.
   */
  private handleOverlayBackgroundClick(): void {
    return;
  }

  /**
   * Checks if the user is authenticated.
   */
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }
}

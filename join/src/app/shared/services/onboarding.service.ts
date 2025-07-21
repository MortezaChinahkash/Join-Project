import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  route: string;
  targetElementSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightNavItem?: string;
}

/**
 * Onboarding service for guiding new users through the application.
 * Manages the step-by-step tour for first-time users.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly ONBOARDING_COMPLETED_KEY = 'join_onboarding_completed';
  private showOnboardingSubject = new BehaviorSubject<boolean>(false);
  public showOnboarding$ = this.showOnboardingSubject.asObservable();
  private currentStepSubject = new BehaviorSubject<number>(0);
  public currentStep$ = this.currentStepSubject.asObservable();
  private readonly onboardingSteps: OnboardingStep[] = [
    {
      id: 'summary',
      title: 'Summary Dashboard',
      description: 'Here you can see an overview of all your tasks, deadlines, and progress at a glance. This is your main dashboard where you start your day.',
      route: '/summary',
      targetElementSelector: 'app-nav li.nav-item a[routerLink="summary"]',
      position: 'right',
      highlightNavItem: 'summary'
    },
    {
      id: 'add-task',
      title: 'Add New Tasks',
      description: 'Click here to create new tasks. You can set titles, descriptions, due dates, priorities, and assign them to team members.',
      route: '/add-task',
      targetElementSelector: 'app-nav li.nav-item a[routerLink="/add-task"]',
      position: 'right',
      highlightNavItem: 'add-task'
    },
    {
      id: 'board',
      title: 'Task Board',
      description: 'The board shows all your tasks organized in columns: To Do, In Progress, Awaiting Feedback, and Done. Drag and drop tasks to move them between stages.',
      route: '/board',
      targetElementSelector: 'app-nav li.nav-item a[routerLink="/board"]',
      position: 'right',
      highlightNavItem: 'board'
    },
    {
      id: 'contacts',
      title: 'Manage Contacts',
      description: 'Here you can manage your team members and contacts. Add new people to collaborate with and assign tasks to them.',
      route: '/contacts',
      targetElementSelector: 'app-nav li.nav-item a[routerLink="contacts"]',
      position: 'right',
      highlightNavItem: 'contacts'
    }
  ];
  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.initializeOnboarding();
    // Add global function for testing
    (window as any).startOnboarding = () => this.manualStartOnboarding();
  }

  /**
   * Initializes the onboarding system.
   */
  private initializeOnboarding(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && !user.isGuest) {
        this.checkAndStartOnboarding();
      }
    });
  }

  /**
   * Checks if onboarding should be shown and starts it if needed.
   */
  private checkAndStartOnboarding(): void {
    // Only show onboarding for authenticated users
    if (!this.authService.isAuthenticated) {
      return;
    }
    const isCompleted = localStorage.getItem(this.ONBOARDING_COMPLETED_KEY);
    const isNewUser = localStorage.getItem('join_new_user');
    if (!isCompleted && isNewUser) {
      // Clear the new user flag
      localStorage.removeItem('join_new_user');
      // Wait a bit for the navigation to be ready
      setTimeout(() => {
        this.startOnboarding();
      }, 1000);
    }
  }
  
  /**
   * Starts the onboarding tour.
   */
  public startOnboarding(): void {
    // Only allow onboarding for authenticated users
    if (!this.authService.isAuthenticated) {
      return;
    }
    this.currentStepSubject.next(0);
    this.showOnboardingSubject.next(true);
    // Navigate to first step
    const firstStep = this.onboardingSteps[0];
    this.router.navigate([firstStep.route]);
  }

  /**
   * Moves to the next step in the onboarding.
   */
  public nextStep(): void {
    const currentStep = this.currentStepSubject.value;
    if (currentStep < this.onboardingSteps.length - 1) {
      const nextStepIndex = currentStep + 1;
      this.currentStepSubject.next(nextStepIndex);
      // Navigate to next step route
      const nextStep = this.onboardingSteps[nextStepIndex];
      this.router.navigate([nextStep.route]);
    } else {
      this.completeOnboarding();
    }
  }

  /**
   * Moves to the previous step in the onboarding.
   */
  public previousStep(): void {
    const currentStep = this.currentStepSubject.value;
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      this.currentStepSubject.next(prevStepIndex);
      // Navigate to previous step route
      const prevStep = this.onboardingSteps[prevStepIndex];
      this.router.navigate([prevStep.route]);
    }
  }

  /**
   * Skips the onboarding tour.
   */
  public skipOnboarding(): void {
    this.completeOnboarding();
  }

  /**
   * Completes the onboarding and hides the overlay.
   */
  private completeOnboarding(): void {
    localStorage.setItem(this.ONBOARDING_COMPLETED_KEY, 'true');
    this.showOnboardingSubject.next(false);
    this.currentStepSubject.next(0);
  }

  /**
   * Gets the current step data.
   */
  public getCurrentStep(): OnboardingStep | null {
    const currentIndex = this.currentStepSubject.value;
    return this.onboardingSteps[currentIndex] || null;
  }

  /**
   * Gets all onboarding steps.
   */
  public getAllSteps(): OnboardingStep[] {
    return this.onboardingSteps;
  }

  /**
   * Checks if it's the first step.
   */
  public isFirstStep(): boolean {
    return this.currentStepSubject.value === 0;
  }

  /**
   * Checks if it's the last step.
   */
  public isLastStep(): boolean {
    return this.currentStepSubject.value === this.onboardingSteps.length - 1;
  }

  /**
   * Gets the current step number (1-based).
   */
  public getCurrentStepNumber(): number {
    return this.currentStepSubject.value + 1;
  }

  /**
   * Gets the total number of steps.
   */
  public getTotalSteps(): number {
    return this.onboardingSteps.length;
  }

  /**
   * Resets onboarding (for testing purposes).
   */
  public resetOnboarding(): void {
    localStorage.removeItem(this.ONBOARDING_COMPLETED_KEY);
    this.showOnboardingSubject.next(false);
    this.currentStepSubject.next(0);
  }

  /**
   * Manually starts onboarding (for testing or manual trigger).
   */
  public manualStartOnboarding(): void {
    localStorage.removeItem(this.ONBOARDING_COMPLETED_KEY);
    this.startOnboarding();
  }
}

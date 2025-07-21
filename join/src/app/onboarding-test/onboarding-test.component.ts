// Development helper component for testing onboarding
// This component should be removed in production
import { Component } from '@angular/core';
import { OnboardingService } from '../shared/services/onboarding.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-onboarding-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="onboarding-test-controls" *ngIf="showControls">
      <button class="test-btn" (click)="startOnboarding()">
        ðŸŽ¯ Start Onboarding
      </button>
      <button class="test-btn" (click)="resetOnboarding()">
        ðŸ”„ Reset Onboarding
      </button>
    </div>
  `,
  styles: [`
    .onboarding-test-controls {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 1000;
    }
    .test-btn {
      background: #29abe2;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    }
    .test-btn:hover {
      background: #2196c7;
      transform: translateY(-1px);
    }
    @media (max-width: 768px) {
      .onboarding-test-controls {
        bottom: 10px;
        right: 10px;
      }
      .test-btn {
        padding: 6px 10px;
        font-size: 0.7rem;
      }
    }

  `]
})
export class OnboardingTestComponent {
  // Show controls only in development
  showControls = !window.location.hostname.includes('production');
  constructor(private onboardingService: OnboardingService) {}

  startOnboarding(): void {
    this.onboardingService.manualStartOnboarding();
  }

  resetOnboarding(): void {
    this.onboardingService.resetOnboarding();
  }
}

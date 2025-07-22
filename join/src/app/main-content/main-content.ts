import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from "../nav/nav.component";
import { HeaderComponent } from '../header/header.component';
import { OnboardingOverlayComponent } from '../onboarding-overlay/onboarding-overlay.component';
/**
 * Main content component that serves as the layout wrapper for the application
 * Contains the navigation, header, and main content area
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavComponent, HeaderComponent, OnboardingOverlayComponent],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {
  /** The application title */
  title = 'Portfolio';
}

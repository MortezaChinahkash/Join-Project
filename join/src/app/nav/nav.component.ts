import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FooterComponent } from "../footer/footer.component";
import { RouterModule } from '@angular/router';
import { InlineSvgDirective } from '../inline-svg.directive';
import { AuthService } from '../shared/services/auth.service';
import { CommonModule } from '@angular/common';
/**
 * Navigation component that provides the main sidebar navigation.
 * Handles navigation menu functionality and route management.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [FooterComponent, RouterModule, InlineSvgDirective, CommonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent implements OnInit {
  /** Currently active navigation item */
  activeRoute: string = '';
  /**
   * Initializes the navigation component.
   * @param router - Angular router service
   * @param authService - Authentication service
   */
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  /**
   * Angular lifecycle hook for component initialization.
   */
  ngOnInit(): void {
    this.initializeNavigation();
  }

  /**
   * Initializes navigation state and active route tracking.
   */
  private initializeNavigation(): void {
    this.updateActiveRoute();
    this.setupRouteTracking();
  }

  /**
   * Updates the currently active route.
   */
  private updateActiveRoute(): void {
    this.activeRoute = this.router.url;
  }

  /**
   * Sets up route change tracking.
   */
  private setupRouteTracking(): void {
    this.router.events.subscribe(() => {
      this.updateActiveRoute();
    });
  }

  /**
   * Checks if a route is currently active.
   * @param route - Route to check
   * @returns True if route is active
   */
  isRouteActive(route: string): boolean {
    return this.activeRoute === route;
  }

  /**
   * Navigates to the specified route.
   * @param route - Route to navigate to
   */
  navigateToRoute(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Gets navigation item CSS classes.
   * @param route - Route for the navigation item
   * @returns CSS class string
   */
  getNavItemClasses(route: string): string {
    return this.isRouteActive(route) ? 'nav-item active' : 'nav-item';
  }

  /**
   * Gets the current user from AuthService.
   */
  get currentUser() {
    return this.authService.currentUser;
  }

  /**
   * Checks if user is authenticated.
   */
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  /**
   * Navigates to the login page.
   */
  navigateToLogin(): void {
    this.router.navigate(['/auth']);
  }
}

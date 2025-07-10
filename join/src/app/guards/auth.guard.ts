import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication.
 * Redirects unauthenticated users to the auth page.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Determines if a route can be activated.
   * @returns true if user is authenticated, false otherwise
   */
  canActivate(): boolean {
    if (this.authService.isAuthenticated) {
      return true;
    }
    
    // Redirect to auth page if not authenticated
    this.router.navigate(['/auth']);
    return false;
  }
}

import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class WelcomeOverlayService {
  private shouldShowOverlay = false;
  /**
   * Mark that overlay should be shown (called after successful login)
   */
  markShouldShow(): void {
    this.shouldShowOverlay = true;
  }

  /**
   * Check if overlay should be shown and reset the flag
   */
  shouldShow(): boolean {
    const should = this.shouldShowOverlay;
    this.shouldShowOverlay = false; // Reset after checking
    return should;
  }

  /**
   * Clear the flag (useful for logout)
   */
  clear(): void {
    this.shouldShowOverlay = false;
  }
}

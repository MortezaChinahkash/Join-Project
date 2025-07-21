import { Component, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [CommonModule, RouterModule]
})
export class HeaderComponent {
  isOverlayVisible = false;
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  get currentUser() {
    return this.authService.currentUser;
  }

  get userDisplayName() {
    return this.authService.getUserDisplayName();
  }

  get userFullName() {
    return this.authService.getUserFullName();
  }

  get userEmail() {
    return this.authService.getUserEmail();
  }

  get isGuest() {
    return this.authService.isGuest;
  }

  toggleOverlay() {
    this.isOverlayVisible = !this.isOverlayVisible;
  }

  closeOverlay() {
    this.isOverlayVisible = false;
  }

  navigateToLegalNotice() {
    this.router.navigate(['/imprint']);
    this.closeOverlay();
  }

  navigateToPrivacyPolicy() {
    this.router.navigate(['/privacy']);
    this.closeOverlay();
  }

  navigateToLogin() {
    this.router.navigate(['/auth']);
  }

  async logout() {
    try {
      await this.authService.logout();
      this.closeOverlay();
    } catch (error) {

      console.error('Logout failed:', error);
    }
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const userElement = document.querySelector('.user');
    const overlayElement = document.querySelector('.mini-overlay');
    // Close overlay if clicking outside of user icon and overlay
    if (userElement && overlayElement && 
        !userElement.contains(target) && 
        !overlayElement.contains(target)) {
      this.closeOverlay();
    }
  }
}

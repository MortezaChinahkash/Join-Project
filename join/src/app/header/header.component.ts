import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  isOverlayVisible = false;

  constructor(private router: Router) {}

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

  logout() {
    // Implement logout logic here
    console.log('Logout clicked');
    this.closeOverlay();
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

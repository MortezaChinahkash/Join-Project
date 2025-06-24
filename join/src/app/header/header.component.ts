import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Header component that displays the application header with user menu functionality
 * Includes overlay menu that can be toggled and closed by clicking outside
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  /** Controls the visibility of the user overlay menu */
  isOverlayVisible = false;

  /**
   * Toggles the visibility of the user overlay menu
   */
  toggleOverlay() {
    this.isOverlayVisible = !this.isOverlayVisible;
  }

  /**
   * Closes the user overlay menu
   */
  closeOverlay() {
    this.isOverlayVisible = false;
  }

  /**
   * Handles document click events to close overlay when clicking outside
   * @param event - The click event from the document
   */
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

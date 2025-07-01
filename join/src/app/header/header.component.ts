import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Header component that displays the application header with user menu functionality.
 * Includes overlay menu that can be toggled and closed by clicking outside.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
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
   * Toggles the visibility of the user overlay menu.
   */
  toggleOverlay(): void {
    this.isOverlayVisible = !this.isOverlayVisible;
  }

  /**
   * Closes the user overlay menu.
   */
  closeOverlay(): void {
    this.isOverlayVisible = false;
  }

  /**
   * Handles document click events to close overlay when clicking outside.
   * @param event - The click event from the document
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.shouldCloseOverlay(event)) {
      this.closeOverlay();
    }
  }

  /**
   * Determines if overlay should be closed based on click target.
   * @param event - Click event
   * @returns True if overlay should be closed
   */
  private shouldCloseOverlay(event: Event): boolean {
    const target = event.target as HTMLElement;
    return this.isClickOutsideOverlayArea(target);
  }

  /**
   * Checks if click is outside the overlay area.
   * @param target - Click target element
   * @returns True if click is outside overlay area
   */
  private isClickOutsideOverlayArea(target: HTMLElement): boolean {
    const userElement = this.getUserElement();
    const overlayElement = this.getOverlayElement();
    
    if (!userElement || !overlayElement) {
      return false;
    }
    
    return !userElement.contains(target) && !overlayElement.contains(target);
  }

  /**
   * Gets the user element from DOM.
   * @returns User element or null
   */
  private getUserElement(): Element | null {
    return document.querySelector('.user');
  }

  /**
   * Gets the overlay element from DOM.
   * @returns Overlay element or null
   */
  private getOverlayElement(): Element | null {
    return document.querySelector('.mini-overlay');
  }
}

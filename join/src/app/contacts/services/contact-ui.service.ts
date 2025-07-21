import { Injectable } from '@angular/core';
import { Contact } from './contact-data.service';
/**
 * Service for managing UI state and interactions in the contacts component.
 * Handles overlay visibility, mobile view state, and user interaction logic.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ContactUiService {
  /**
   * Determines if current view is mobile based on window width.
   * @returns True if mobile view
   */
  isMobileView(): boolean {
    return window.innerWidth <= 1000;
  }

  /**
   * Shows success message for specified duration.
   * @param message - Message to display
   * @param duration - Duration in milliseconds (default: 3000)
   * @returns Promise that resolves when message is hidden
   */
  showSuccessMessage(message: string, duration: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }
  /**
   * Validates email format.
   * @param email - Email to validate
   * @returns True if email format is valid
   */
  validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validates contact form data.
   * @param contact - Contact data to validate
   * @returns Validation result with status and errors
   */
  validateContactForm(contact: Partial<Contact>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if (!contact.name?.trim()) {
      errors.push('Name is required');
    }
    if (!contact.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.validateEmailFormat(contact.email)) {

      errors.push('Email format is invalid');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Sanitizes contact input data.
   * @param contact - Contact data to sanitize
   * @returns Sanitized contact data
   */
  sanitizeContactData(contact: Partial<Contact>): Partial<Contact> {
    return {
      name: contact.name?.trim(),
      email: contact.email?.trim().toLowerCase(),
      phone: contact.phone?.trim() || 'N/A'
    };
  }

  /**
   * Handles responsive behavior updates.
   * @param currentMobileState - Current mobile view state
   * @param showSingleContact - Current single contact view state
   * @returns Updated state object
   */
  updateResponsiveState(
    currentMobileState: boolean, 
    showSingleContact: boolean
  ): {
    isMobileView: boolean;
    showMobileSingleContact: boolean;
  } {
    const newMobileState = this.isMobileView();
    return {
      isMobileView: newMobileState,
      showMobileSingleContact: newMobileState ? showSingleContact : false
    };
  }
  /**
   * Determines appropriate FAB action based on current state.
   * @param isMobileView - Current mobile view state
   * @param showSingleContact - Current single contact view state
   * @returns Action type for FAB button
   */
  getFabAction(isMobileView: boolean, showSingleContact: boolean): 'add' | 'more' {
    return isMobileView && showSingleContact ? 'more' : 'add';
  }

  /**
   * Processes overlay transitions with proper timing.
   * @param action - Action to perform during transition
   * @param delay - Delay in milliseconds (default: 350)
   * @returns Promise that resolves after action completion
   */
  processOverlayTransition(action: () => void, delay: number = 350): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        action();
        resolve();
      }, delay);
    });
  }
  /**
   * Manages animation suppression for smooth transitions.
   * @param suppressCallback - Callback to execute with suppression
   * @returns Promise that resolves after animation handling
   */
  handleAnimationSuppression(suppressCallback: () => void): Promise<void> {
    return new Promise((resolve) => {
      suppressCallback();
      setTimeout(() => {
        resolve();
      }, 200);
    });
  }
  /**
   * Formats contact display information.
   * @param contact - Contact to format
   * @returns Formatted contact display object
   */
  formatContactDisplay(contact: Contact): {
    displayName: string;
    displayEmail: string;
    displayPhone: string;
    hasValidPhone: boolean;
  } {
    return {
      displayName: contact.name?.trim() || 'Unknown',
      displayEmail: contact.email?.trim() || 'No email',
      displayPhone: contact.phone?.trim() || 'N/A',
      hasValidPhone: !!(contact.phone?.trim() && contact.phone !== 'N/A')
    };
  }
  /**
   * Handles keyboard navigation for contact selection.
   * @param event - Keyboard event
   * @param contacts - Available contacts
   * @param currentIndex - Current selected index
   * @returns New selected index
   */
  handleKeyboardNavigation(
    event: KeyboardEvent, 
    contacts: Contact[], 
    currentIndex: number
  ): number {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        return Math.min(currentIndex + 1, contacts.length - 1);
      case 'ArrowUp':
        event.preventDefault();
        return Math.max(currentIndex - 1, 0);
      default:
        return currentIndex;
    }
  }
}

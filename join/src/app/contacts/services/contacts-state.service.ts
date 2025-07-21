import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
/**
 * Service for managing contacts component state and UI interactions.
 * Handles overlay states, mobile view management, and UI transitions.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })

export class ContactsStateService {
  private showAddContactOverlaySubject = new BehaviorSubject<boolean>(false);
  private showEditContactOverlaySubject = new BehaviorSubject<boolean>(false);
  private showMobileMoreMenuSubject = new BehaviorSubject<boolean>(false);
  private contactSuccessMessageOverlaySubject = new BehaviorSubject<boolean>(false);
  private isMobileViewSubject = new BehaviorSubject<boolean>(false);
  private showMobileSingleContactSubject = new BehaviorSubject<boolean>(false);
  private suppressAnimationSubject = new BehaviorSubject<boolean>(false);
  private contactSuccessMessageTextSubject = new BehaviorSubject<string>('Contact successfully created!');
  showAddContactOverlay$ = this.showAddContactOverlaySubject.asObservable();
  showEditContactOverlay$ = this.showEditContactOverlaySubject.asObservable();
  showMobileMoreMenu$ = this.showMobileMoreMenuSubject.asObservable();
  contactSuccessMessageOverlay$ = this.contactSuccessMessageOverlaySubject.asObservable();
  isMobileView$ = this.isMobileViewSubject.asObservable();
  showMobileSingleContact$ = this.showMobileSingleContactSubject.asObservable();
  suppressAnimation$ = this.suppressAnimationSubject.asObservable();
  contactSuccessMessageText$ = this.contactSuccessMessageTextSubject.asObservable();
  get showAddContactOverlay(): boolean { return this.showAddContactOverlaySubject.value; }

  get showEditContactOverlay(): boolean { return this.showEditContactOverlaySubject.value; }

  get showMobileMoreMenu(): boolean { return this.showMobileMoreMenuSubject.value; }

  get contactSuccessMessageOverlay(): boolean { return this.contactSuccessMessageOverlaySubject.value; }

  get isMobileView(): boolean { return this.isMobileViewSubject.value; }

  get showMobileSingleContact(): boolean { return this.showMobileSingleContactSubject.value; }

  get suppressAnimation(): boolean { return this.suppressAnimationSubject.value; }

  get contactSuccessMessageText(): string { return this.contactSuccessMessageTextSubject.value; }

  /**
   * Opens the add contact overlay.
   */
  openAddContactOverlay(): void {
    this.showAddContactOverlaySubject.next(true);
  }

  /**
   * Closes the add contact overlay.
   */
  closeAddContactOverlay(): void {
    this.showAddContactOverlaySubject.next(false);
  }

  /**
   * Opens the edit contact overlay.
   */
  openEditContactOverlay(): void {
    this.showEditContactOverlaySubject.next(true);
  }

  /**
   * Closes the edit contact overlay.
   */
  closeEditContactOverlay(): void {
    this.showEditContactOverlaySubject.next(false);
  }

  /**
   * Opens the mobile more menu.
   */
  openMobileMoreMenu(): void {
    this.showMobileMoreMenuSubject.next(true);
  }

  /**
   * Closes the mobile more menu.
   */
  closeMobileMoreMenu(): void {
    this.showMobileMoreMenuSubject.next(false);
  }

  /**
   * Shows the success message overlay.
   * 
   * @param message - Success message to display
   */
  showSuccessMessage(message: string): void {
    this.contactSuccessMessageTextSubject.next(message);
    this.contactSuccessMessageOverlaySubject.next(true);
  }

  /**
   * Hides the success message overlay.
   */
  hideSuccessMessage(): void {
    this.contactSuccessMessageOverlaySubject.next(false);
  }

  /**
   * Updates mobile view status based on window width.
   * 
   * @param windowWidth - Current window width
   */
  updateMobileViewStatus(windowWidth: number = window.innerWidth): void {
    const isMobile = windowWidth <= 768;
    this.isMobileViewSubject.next(isMobile);
    if (!isMobile && this.showMobileSingleContact) {
      this.showMobileSingleContactSubject.next(false);
    }
  }

  /**
   * Shows mobile single contact view.
   */
  showMobileSingleContactView(): void {
    if (this.isMobileView) {
      this.showMobileSingleContactSubject.next(true);
    }
  }

  /**
   * Hides mobile single contact view and returns to list.
   */
  backToContactList(): void {
    this.showMobileSingleContactSubject.next(false);
    this.closeMobileMoreMenu();
  }

  /**
   * Enables animation suppression (for delete operations).
   */
  suppressAnimations(): void {
    this.suppressAnimationSubject.next(true);
  }

  /**
   * Disables animation suppression.
   */
  enableAnimations(): void {
    this.suppressAnimationSubject.next(false);
  }

  /**
   * Determines FAB action based on current mobile state.
   * 
   * @returns FAB action type
   */
  getFabAction(): 'add' | 'more' {
    return (this.isMobileView && this.showMobileSingleContact) ? 'more' : 'add';
  }

  /**
   * Checks if any overlay is currently open.
   * 
   * @returns True if any overlay is open
   */
  isAnyOverlayOpen(): boolean {
    return this.showAddContactOverlay || 
           this.showEditContactOverlay || 
           this.showMobileMoreMenu || 
           this.contactSuccessMessageOverlay;
  }

  /**
   * Closes all overlays.
   */
  closeAllOverlays(): void {
    this.closeAddContactOverlay();
    this.closeEditContactOverlay();
    this.closeMobileMoreMenu();
    this.hideSuccessMessage();
  }

  /**
   * Gets responsive state object for component updates.
   * 
   * @returns Current responsive state
   */
  getResponsiveState(): {
    isMobileView: boolean;
    showMobileSingleContact: boolean;
    showMobileMoreMenu: boolean;
  } {
    return {
      isMobileView: this.isMobileView,
      showMobileSingleContact: this.showMobileSingleContact,
      showMobileMoreMenu: this.showMobileMoreMenu
    };
  }

  /**
   * Sets up window resize listener for responsive behavior.
   * 
   * @returns Cleanup function to remove listener
   */
  setupResizeListener(): () => void {
    const handleResize = () => this.updateMobileViewStatus();
    window.addEventListener('resize', handleResize);
    this.updateMobileViewStatus();
    return () => window.removeEventListener('resize', handleResize);
  }

  /**
   * Handles component initialization state setup.
   */
  initializeState(): void {
    this.updateMobileViewStatus();
    this.enableAnimations();
    this.closeAllOverlays();
  }

  /**
   * Resets all state to initial values.
   */
  resetState(): void {
    this.closeAllOverlays();
    this.showMobileSingleContactSubject.next(false);
    this.enableAnimations();
  }

  /**
   * Handles navigation state for mobile views.
   * 
   * @param action - Navigation action
   */
  handleMobileNavigation(action: 'select' | 'back' | 'menu'): void {
    switch (action) {
      case 'select':
        this.showMobileSingleContactView();
        break;
      case 'back':
        this.backToContactList();
        break;
      case 'menu':
        this.openMobileMoreMenu();
        break;
    }
  }

  /**
   * Gets current overlay state summary.
   * 
   * @returns Object with all overlay states
   */
  getOverlayStates(): {
    addContact: boolean;
    editContact: boolean;
    mobileMenu: boolean;
    successMessage: boolean;
  } {
    return {
      addContact: this.showAddContactOverlay,
      editContact: this.showEditContactOverlay,
      mobileMenu: this.showMobileMoreMenu,
      successMessage: this.contactSuccessMessageOverlay
    };
  }

  /**
   * Cleanup method for service destruction.
   */
  cleanup(): void {
    this.resetState();
  }
}

import { Injectable } from '@angular/core';
import { Contact } from './contact-data.service';
import { ContactsStateService } from './contacts-state.service';
import { ContactsDisplayService } from './contacts-display.service';
import { ContactUiService } from './contact-ui.service';
import { ContactsFormService } from './contacts-form.service';

/**
 * Service responsible for contact navigation, selection, and user interaction handling.
 * Manages contact selection, mobile navigation, FAB actions, and menu interactions.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class ContactNavigationService {

  constructor(
    private stateService: ContactsStateService,
    private displayService: ContactsDisplayService,
    private uiService: ContactUiService,
    private formService: ContactsFormService
  ) {}

  /**
   * Selects a contact and handles mobile view navigation.
   * 
   * @param contact - Contact to select
   * @param onContactSelected - Callback when contact is selected
   */
  selectContact(
    contact: Contact, 
    onContactSelected: (contact: Contact) => void
  ): void {
    onContactSelected(contact);
    if (this.stateService.isMobileView) {
      this.stateService.showMobileSingleContactView();
    }
  }

  /**
   * Selects the current user and creates a contact-like object for display.
   * 
   * @param onContactSelected - Callback when contact is selected
   */
  selectCurrentUser(onContactSelected: (contact: Contact) => void): void {
    const currentUserContact = this.displayService.getCurrentUserAsContact();
    if (currentUserContact) {
      this.selectContact(currentUserContact, onContactSelected);
    }
  }

  /**
   * Navigates back to contact list on mobile and clears selection.
   * 
   * @param onContactCleared - Callback when contact selection is cleared
   */
  backToList(onContactCleared: () => void): void {
    this.stateService.backToContactList();
    onContactCleared();
  }

  /**
   * Handles FAB (Floating Action Button) click based on current application state.
   * 
   * @param onOpenMoreMenu - Callback to open more menu
   * @param onOpenAddContact - Callback to open add contact overlay
   */
  handleFabClick(
    onOpenMoreMenu: () => void,
    onOpenAddContact: () => void
  ): void {
    const action = this.stateService.getFabAction();
    if (action === 'more') {
      this.openMoreMenu(onOpenMoreMenu);
    } else {
      this.openAddContactOverlay(onOpenAddContact);
    }
  }

  /**
   * Opens mobile more menu.
   * 
   * @param onMenuOpened - Callback when menu is opened
   */
  openMoreMenu(onMenuOpened: () => void): void {
    this.stateService.openMobileMoreMenu();
    onMenuOpened();
  }

  /**
   * Closes mobile more menu.
   */
  closeMoreMenu(): void {
    this.stateService.closeMobileMoreMenu();
  }

  /**
   * Opens add contact overlay and prepares form.
   * 
   * @param onOverlayOpened - Callback when overlay is opened
   */
  openAddContactOverlay(onOverlayOpened: () => void): void {
    this.stateService.openAddContactOverlay();
    this.formService.resetForm();
    onOverlayOpened();
  }

  /**
   * Closes add contact overlay.
   */
  closeAddContactOverlay(): void {
    this.stateService.closeAddContactOverlay();
  }

  /**
   * Opens edit contact overlay for a specific contact.
   * 
   * @param contact - Contact to edit
   * @param onContactSelected - Callback when contact is selected for editing
   */
  openEditContactOverlay(
    contact: Contact,
    onContactSelected: (contact: Contact) => void
  ): void {
    this.stateService.openEditContactOverlay();
    onContactSelected(contact);
    this.formService.populateForm(contact);
  }

  /**
   * Closes edit contact overlay.
   */
  closeEditContactOverlay(): void {
    this.stateService.closeEditContactOverlay();
  }

  /**
   * Shows success message with automatic hiding.
   * 
   * @param message - Message to display
   * @param onMessageHidden - Callback when message is hidden
   */
  showSuccessMessage(
    message: string,
    onMessageHidden: () => void
  ): void {
    this.stateService.showSuccessMessage(message);
    this.uiService.showSuccessMessage(message).then(() => {
      this.stateService.hideSuccessMessage();
      onMessageHidden();
    });
  }

  /**
   * Updates mobile view status and responsive state.
   */
  updateMobileViewStatus(): void {
    this.stateService.updateMobileViewStatus();
  }

  /**
   * Clears selected contact asynchronously with animation management.
   * 
   * @param onContactCleared - Callback when contact is cleared
   */
  clearSelectedContactAsync(onContactCleared: () => void): void {
    setTimeout(() => {
      onContactCleared();
      this.stateService.enableAnimations();
    }, 0);
  }
}

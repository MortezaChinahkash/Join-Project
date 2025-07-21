import { Injectable } from '@angular/core';
import { Contact } from '../../../contacts/services/contact-data.service';
/**
 * Service for managing contact selection and dropdown functionality.
 * Handles contact assignment, dropdown states, and contact display logic.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })

export class BoardFormContactSelectionService {
  // Contact selection state
  selectedContacts: Contact[] = [];
  isDropdownOpen = false;
  showAssignedContactsDropdown = false;
  // Dropdown management
  private preventDropdownClose = false;
  private documentClickListener?: (event: Event) => void;
  private assignedContactsClickListener?: (event: Event) => void;
  /**
   * Toggles contact selection for task assignment.
   * 
   * @param contact - Contact to toggle
   */
  toggleContact(contact: Contact): void {
    const index = this.selectedContacts.findIndex(c => c.id === contact.id);
    if (index > -1) {
      this.selectedContacts.splice(index, 1);
    } else {
      this.selectedContacts.push(contact);
    }
  }

  /**
   * Checks if a contact is currently selected.
   * 
   * @param contact - Contact to check
   * @returns True if contact is selected
   */
  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.id === contact.id);
  }

  /**
   * Gets display text for selected contacts.
   * 
   * @returns Formatted string of selected contact names
   */
  getSelectedContactsText(): string {
    if (this.selectedContacts.length === 0) return '';
    if (this.selectedContacts.length === 1) {
      return this.selectedContacts[0].name;
    } else if (this.selectedContacts.length === 2) {

      return this.selectedContacts.map(c => c.name).join(', ');
    } else {
      return `${this.selectedContacts[0].name} +${this.selectedContacts.length - 1} more`;
    }
  }
  /**
   * Gets the first selected contact (for single selection scenarios).
   * 
   * @returns First selected contact or null
   */
  getSelectedContact(): Contact | null {
    return this.selectedContacts.length > 0 ? this.selectedContacts[0] : null;
  }

  /**
   * Toggles the contact selection dropdown.
   */
  toggleDropdown(): void {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Opens the contact selection dropdown.
   */
  openDropdown(): void {
    this.isDropdownOpen = true;
    this.addDocumentClickListener();
  }

  /**
   * Closes the contact selection dropdown.
   */
  closeDropdown(): void {
    if (this.preventDropdownClose) {
      this.preventDropdownClose = false;
      return;
    }
    this.isDropdownOpen = false;
    this.removeDocumentClickListener();
  }

  /**
   * Prevents dropdown from closing on next close attempt.
   */
  preventNextClose(): void {
    this.preventDropdownClose = true;
  }

  /**
   * Adds document click listener to close dropdown when clicking outside.
   */
  private addDocumentClickListener(): void {
    this.removeDocumentClickListener(); // Remove any existing listener
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('.contact-dropdown');
      const trigger = target.closest('.contact-dropdown-trigger');
      if (!dropdown && !trigger) {
        this.closeDropdown();
      }
    };

    // Add with a small delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', this.documentClickListener!);
    }, 100);
  }
  /**
   * Removes document click listener.
   */
  private removeDocumentClickListener(): void {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
      this.documentClickListener = undefined;
    }
  }

  /**
   * Toggles the assigned contacts dropdown for display.
   */
  toggleAssignedContactsDropdown(): void {
    if (this.showAssignedContactsDropdown) {
      this.closeAssignedContactsDropdown();
    } else {
      this.openAssignedContactsDropdown();
    }
  }

  /**
   * Opens the assigned contacts dropdown.
   */
  openAssignedContactsDropdown(): void {
    this.showAssignedContactsDropdown = true;
    this.addAssignedContactsClickListener();
  }

  /**
   * Closes the assigned contacts dropdown.
   */
  closeAssignedContactsDropdown(): void {
    this.showAssignedContactsDropdown = false;
    this.removeAssignedContactsClickListener();
  }

  /**
   * Adds click listener for assigned contacts dropdown.
   */
  private addAssignedContactsClickListener(): void {
    this.removeAssignedContactsClickListener();
    this.assignedContactsClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('.assigned-contacts-dropdown');
      const trigger = target.closest('.assigned-contacts-trigger');
      if (!dropdown && !trigger) {
        this.closeAssignedContactsDropdown();
      }
    };

    setTimeout(() => {
      document.addEventListener('click', this.assignedContactsClickListener!);
    }, 100);
  }
  /**
   * Removes assigned contacts click listener.
   */
  private removeAssignedContactsClickListener(): void {
    if (this.assignedContactsClickListener) {
      document.removeEventListener('click', this.assignedContactsClickListener);
      this.assignedContactsClickListener = undefined;
    }
  }

  /**
   * Gets displayed assigned contacts (limited number for UI).
   * 
   * @param limit - Maximum number to display
   * @returns Array of contact names to display
   */
  getDisplayedAssignedContacts(limit: number = 3): string[] {
    return this.selectedContacts.slice(0, limit).map(contact => contact.name);
  }

  /**
   * Checks if there are more assigned contacts than displayed.
   * 
   * @param limit - Display limit
   * @returns True if there are more contacts
   */
  hasMoreAssignedContacts(limit: number = 3): boolean {
    return this.selectedContacts.length > limit;
  }

  /**
   * Gets count of remaining assigned contacts not displayed.
   * 
   * @param limit - Display limit
   * @returns Count of remaining contacts
   */
  getRemainingAssignedContactsCount(limit: number = 3): number {
    return Math.max(0, this.selectedContacts.length - limit);
  }

  /**
   * Gets remaining assigned contacts not displayed.
   * 
   * @param limit - Display limit
   * @returns Array of remaining contact names
   */
  getRemainingAssignedContacts(limit: number = 3): string[] {
    return this.selectedContacts.slice(limit).map(contact => contact.name);
  }

  /**
   * Clears all selected contacts.
   */
  clearSelectedContacts(): void {
    this.selectedContacts = [];
  }

  /**
   * Sets selected contacts from an array of contact IDs.
   * 
   * @param contactIds - Array of contact IDs
   * @param allContacts - Array of all available contacts
   */
  setSelectedContactsByIds(contactIds: string[], allContacts: Contact[]): void {
    this.selectedContacts = allContacts.filter(contact => 
      contactIds.includes(contact.id || '')
    );
  }

  /**
   * Gets selected contact IDs.
   * 
   * @returns Array of selected contact IDs
   */
  getSelectedContactIds(): string[] {
    return this.selectedContacts.map(contact => contact.id || '').filter(id => id);
  }

  /**
   * Adds a contact to selection.
   * 
   * @param contact - Contact to add
   */
  addContact(contact: Contact): void {
    if (!this.isContactSelected(contact)) {
      this.selectedContacts.push(contact);
    }
  }

  /**
   * Removes a contact from selection.
   * 
   * @param contact - Contact to remove
   */
  removeContact(contact: Contact): void {
    const index = this.selectedContacts.findIndex(c => c.id === contact.id);
    if (index > -1) {
      this.selectedContacts.splice(index, 1);
    }
  }

  /**
   * Gets count of selected contacts.
   * 
   * @returns Number of selected contacts
   */
  getSelectedContactsCount(): number {
    return this.selectedContacts.length;
  }

  /**
   * Cleanup method to remove event listeners.
   */
  cleanup(): void {
    this.removeDocumentClickListener();
    this.removeAssignedContactsClickListener();
    this.isDropdownOpen = false;
    this.showAssignedContactsDropdown = false;
  }
}

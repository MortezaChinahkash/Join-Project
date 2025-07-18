import { Injectable } from '@angular/core';
import { Contact } from '../../../contacts/services/contact-data.service';

/**
 * Service for managing contact selection in task forms.
 * Handles dropdown states, contact selection, and click listeners.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardFormContactService {
  // Contact selection state
  isDropdownOpen = false;
  selectedContacts: Contact[] = [];
  showAssignedContactsDropdown = false;
  private preventDropdownClose = false;
  
  // Category selection state
  isCategoryDropdownOpen = false;
  
  // Click outside listener cleanup
  private documentClickListener?: (event: Event) => void;
  private assignedContactsClickListener?: (event: Event) => void;

  /**
   * Toggles the contact dropdown visibility and manages click listeners.
   * Opens or closes the contact selection dropdown and handles outside click detection.
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    
    if (this.isDropdownOpen) {
      this.addDocumentClickListener();
    } else {
      this.removeDocumentClickListener();
    }
  }

  /**
   * Toggles the category dropdown visibility and handles form validation.
   * Opens or closes the category selection dropdown and triggers validation when appropriate.
   */
  toggleCategoryDropdown(): void {
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
    
    if (this.isCategoryDropdownOpen) {
      this.addDocumentClickListener();
    } else {
      this.removeDocumentClickListener();
    }
  }

  /**
   * Toggles contact selection in the assigned contacts list.
   * 
   * @param contact - Contact to toggle
   * @param event - Click event to prevent propagation
   */
  toggleContactSelection(contact: Contact, event: Event): void {
    event.stopPropagation();
    this.preventDropdownClose = true;
    
    const existingIndex = this.selectedContacts.findIndex(c => c.id === contact.id);
    
    if (existingIndex > -1) {
      // Remove contact if already selected
      this.selectedContacts.splice(existingIndex, 1);
    } else {
      // Add contact if not selected
      this.selectedContacts.push(contact);
    }
    
    // Reset flag after a short delay
    setTimeout(() => {
      this.preventDropdownClose = false;
    }, 100);
  }

  /**
   * Selects a contact from the dropdown.
   * 
   * @param contact - Contact to select
   */
  selectContact(contact: Contact): void {
    if (!this.selectedContacts.find(c => c.id === contact.id)) {
      this.selectedContacts.push(contact);
    }
    this.isDropdownOpen = false;
    this.removeDocumentClickListener();
  }

  /**
   * Removes a contact from the selected contacts list.
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
   * Clears all selected contacts.
   */
  clearSelectedContacts(): void {
    this.selectedContacts = [];
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
   * Gets the display text for selected contacts.
   * 
   * @returns Formatted text for selected contacts
   */
  getSelectedContactsDisplayText(): string {
    if (this.selectedContacts.length === 0) {
      return 'Select contacts to assign';
    }
    
    if (this.selectedContacts.length === 1) {
      return this.selectedContacts[0].name;
    }
    
    if (this.selectedContacts.length === 2) {
      return `${this.selectedContacts[0].name} and ${this.selectedContacts[1].name}`;
    }
    
    return `${this.selectedContacts[0].name} and ${this.selectedContacts.length - 1} others`;
  }

  /**
   * Sets the selected contacts list.
   * 
   * @param contacts - Array of contacts to set as selected
   */
  setSelectedContacts(contacts: Contact[]): void {
    this.selectedContacts = [...contacts];
  }

  /**
   * Gets a copy of the selected contacts array.
   * 
   * @returns Copy of selected contacts array
   */
  getSelectedContacts(): Contact[] {
    return [...this.selectedContacts];
  }

  /**
   * Resets all contact selection state.
   */
  resetContactSelection(): void {
    this.selectedContacts = [];
    this.isDropdownOpen = false;
    this.isCategoryDropdownOpen = false;
    this.showAssignedContactsDropdown = false;
    this.removeDocumentClickListener();
    this.removeAssignedContactsClickListener();
  }

  /**
   * Adds document click listener to close dropdowns when clicking outside.
   * @private
   */
  private addDocumentClickListener(): void {
    this.removeDocumentClickListener(); // Remove existing listener first
    
    this.documentClickListener = (event: Event) => {
      if (this.preventDropdownClose) return;
      
      const target = event.target as HTMLElement;
      const isClickInsideDropdown = target.closest('.custom-select') || 
                                   target.closest('.contacts-dropdown') ||
                                   target.closest('.category-dropdown');
      
      if (!isClickInsideDropdown) {
        this.isDropdownOpen = false;
        this.isCategoryDropdownOpen = false;
        this.removeDocumentClickListener();
      }
    };
    
    document.addEventListener('click', this.documentClickListener);
  }

  /**
   * Removes document click listener.
   * @private
   */
  private removeDocumentClickListener(): void {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
      this.documentClickListener = undefined;
    }
  }

  /**
   * Adds assigned contacts click listener.
   * @private
   */
  private addAssignedContactsClickListener(): void {
    this.removeAssignedContactsClickListener();
    
    this.assignedContactsClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const isClickInsideAssignedContacts = target.closest('.assigned-contacts-dropdown');
      
      if (!isClickInsideAssignedContacts) {
        this.showAssignedContactsDropdown = false;
        this.removeAssignedContactsClickListener();
      }
    };
    
    document.addEventListener('click', this.assignedContactsClickListener);
  }

  /**
   * Removes assigned contacts click listener.
   * @private
   */
  private removeAssignedContactsClickListener(): void {
    if (this.assignedContactsClickListener) {
      document.removeEventListener('click', this.assignedContactsClickListener);
      this.assignedContactsClickListener = undefined;
    }
  }

  /**
   * Toggles the assigned contacts dropdown.
   */
  toggleAssignedContactsDropdown(): void {
    this.showAssignedContactsDropdown = !this.showAssignedContactsDropdown;
    
    if (this.showAssignedContactsDropdown) {
      this.addAssignedContactsClickListener();
    } else {
      this.removeAssignedContactsClickListener();
    }
  }

  /**
   * Cleanup method to remove all event listeners.
   * Should be called when component is destroyed.
   */
  cleanup(): void {
    this.removeDocumentClickListener();
    this.removeAssignedContactsClickListener();
  }
}

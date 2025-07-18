import { Injectable } from '@angular/core';
import { Contact } from '../../contacts/services/contact-data.service';

/**
 * Service for managing contact selection in add task component.
 * Handles contact selection logic and display formatting.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AddTaskContactService {

  /**
   * Toggles contact selection state.
   * @param contact - Contact to toggle
   * @param selectedContacts - Currently selected contacts array
   * @returns Updated selected contacts array
   */
  toggleContactSelection(contact: Contact, selectedContacts: Contact[]): Contact[] {
    const updatedContacts = [...selectedContacts];
    
    if (this.isContactSelected(contact, selectedContacts)) {
      return this.removeContactFromSelection(contact, updatedContacts);
    } else {
      return this.addContactToSelection(contact, updatedContacts);
    }
  }

  /**
   * Checks if a contact is currently selected.
   * @param contact - Contact to check
   * @param selectedContacts - Currently selected contacts array
   * @returns True if contact is selected
   */
  isContactSelected(contact: Contact, selectedContacts: Contact[]): boolean {
    return selectedContacts.some(c => c.id === contact.id);
  }

  /**
   * Removes a contact from selection.
   * @param contact - Contact to remove
   * @param selectedContacts - Selected contacts array
   * @returns Updated array without the contact
   */
  private removeContactFromSelection(contact: Contact, selectedContacts: Contact[]): Contact[] {
    const index = selectedContacts.findIndex(c => c.id === contact.id);
    if (index > -1) {
      selectedContacts.splice(index, 1);
    }
    return selectedContacts;
  }

  /**
   * Adds a contact to selection.
   * @param contact - Contact to add
   * @param selectedContacts - Selected contacts array
   * @returns Updated array with the contact
   */
  private addContactToSelection(contact: Contact, selectedContacts: Contact[]): Contact[] {
    selectedContacts.push(contact);
    return selectedContacts;
  }

  /**
   * Formats selected contacts into display text.
   * @param contacts - Selected contacts array
   * @returns Formatted text string
   */
  formatSelectedContactsText(contacts: Contact[]): string {
    if (contacts.length === 0) return '';
    if (contacts.length === 1) return contacts[0].name;
    if (contacts.length === 2) {
      return contacts.map(c => c.name).join(' and ');
    }
    return `${contacts[0].name} and ${contacts.length - 1} others`;
  }

  /**
   * Processes and sorts contacts data.
   * @param contactsData - Raw contacts data
   * @returns Sorted contacts array
   */
  processContactsData(contactsData: Contact[]): Contact[] {
    return contactsData.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Handles dropdown visibility based on click target.
   * @param event - Click event
   * @param isDropdownOpen - Current dropdown state
   * @returns New dropdown state
   */
  handleDropdownClick(event: Event, isDropdownOpen: boolean): boolean {
    if (!isDropdownOpen) return false;
    
    const target = event.target as HTMLElement;
    return this.isClickInsideDropdownArea(target);
  }

  /**
   * Checks if click is inside dropdown area.
   * @param target - Click target element
   * @returns True if click is inside dropdown
   */
  private isClickInsideDropdownArea(target: HTMLElement): boolean {
    const dropdownWrapper = target.closest('.custom-select-wrapper');
    const contactsDropdown = target.closest('.contacts-dropdown');
    return !!(dropdownWrapper || contactsDropdown);
  }

  /**
   * Extracts contact names from selected contacts.
   * @param selectedContacts - Array of selected contacts
   * @returns Array of contact names
   */
  extractContactNames(selectedContacts: Contact[]): string[] {
    return selectedContacts.map(c => c.name);
  }

  /**
   * Validates contact selection.
   * @param selectedContacts - Selected contacts array
   * @returns Validation result
   */
  validateContactSelection(selectedContacts: Contact[]): {
    isValid: boolean;
    message?: string;
  } {
    if (selectedContacts.length === 0) {
      return {
        isValid: false,
        message: 'At least one contact must be assigned'
      };
    }

    return { isValid: true };
  }

  /**
   * Finds a contact by ID.
   * @param contacts - Array of contacts to search
   * @param contactId - ID to search for
   * @returns Found contact or undefined
   */
  findContactById(contacts: Contact[], contactId: string): Contact | undefined {
    return contacts.find(c => c.id === contactId);
  }

  /**
   * Filters contacts by search term.
   * @param contacts - Contacts to filter
   * @param searchTerm - Term to search for
   * @returns Filtered contacts array
   */
  filterContactsBySearch(contacts: Contact[], searchTerm: string): Contact[] {
    if (!searchTerm.trim()) return contacts;
    
    const term = searchTerm.toLowerCase().trim();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(term) ||
      contact.email.toLowerCase().includes(term)
    );
  }

  /**
   * Groups contacts by first letter of name.
   * @param contacts - Contacts to group
   * @returns Grouped contacts object
   */
  groupContactsByLetter(contacts: Contact[]): { [key: string]: Contact[] } {
    return contacts.reduce((groups, contact) => {
      const firstLetter = contact.name[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);
      return groups;
    }, {} as { [key: string]: Contact[] });
  }
}



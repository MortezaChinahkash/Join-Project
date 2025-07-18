import { Injectable } from '@angular/core';
import { Contact } from './contact-data.service';

/**
 * Service for organizing and managing contact display logic.
 * Handles contact grouping, sorting, and utility functions.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ContactOrganizationService {

  /**
   * Groups contacts alphabetically by first letter of name.
   * @param contacts - Array of contacts to group
   * @returns Object with letters as keys and contact arrays as values
   */
  groupContactsByLetter(contacts: Contact[]): { [key: string]: Contact[] } {
    const grouped: { [key: string]: Contact[] } = {};
    
    this.categorizeContactsByLetter(contacts, grouped);
    this.sortContactsWithinGroups(grouped);
    
    return grouped;
  }

  /**
   * Categorizes contacts into letter groups.
   * @param contacts - Contacts to categorize
   * @param grouped - Object to store grouped contacts
   */
  private categorizeContactsByLetter(
    contacts: Contact[], 
    grouped: { [key: string]: Contact[] }
  ): void {
    for (const contact of contacts) {
      const firstLetter = this.extractFirstLetter(contact.name);
      if (firstLetter) {
        this.addContactToGroup(grouped, firstLetter, contact);
      }
    }
  }

  /**
   * Extracts the first letter from a contact name.
   * @param name - Contact name
   * @returns First letter in uppercase or empty string
   */
  private extractFirstLetter(name: string): string {
    if (!name?.trim()) return '';
    return name.trim()[0].toUpperCase();
  }

  /**
   * Adds a contact to the appropriate letter group.
   * @param grouped - Grouped contacts object
   * @param letter - Letter key
   * @param contact - Contact to add
   */
  private addContactToGroup(
    grouped: { [key: string]: Contact[] }, 
    letter: string, 
    contact: Contact
  ): void {
    if (!grouped[letter]) {
      grouped[letter] = [];
    }
    grouped[letter].push(contact);
  }

  /**
   * Sorts contacts alphabetically within each letter group.
   * @param grouped - Grouped contacts object
   */
  private sortContactsWithinGroups(grouped: { [key: string]: Contact[] }): void {
    for (const letter in grouped) {
      grouped[letter].sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
    }
  }

  /**
   * Updates a contact in the contacts array and re-groups.
   * @param contacts - Array of contacts
   * @param updatedContact - Updated contact data
   * @returns Updated contacts array
   */
  updateContactInArray(contacts: Contact[], updatedContact: Contact): Contact[] {
    const index = contacts.findIndex(c => c.id === updatedContact.id);
    if (index !== -1) {
      contacts[index] = { ...contacts[index], ...updatedContact };
    }
    return contacts;
  }

  /**
   * Removes a contact from the contacts array.
   * @param contacts - Array of contacts
   * @param contactId - ID of contact to remove
   * @returns Filtered contacts array
   */
  removeContactFromArray(contacts: Contact[], contactId: string): Contact[] {
    return contacts.filter(c => c.id !== contactId);
  }

  /**
   * Adds a new contact to the contacts array.
   * @param contacts - Existing contacts array
   * @param newContact - New contact to add
   * @returns Updated contacts array
   */
  addContactToArray(contacts: Contact[], newContact: Contact): Contact[] {
    return [...contacts, newContact];
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
   * Gets initials from a contact name.
   * @param name - Contact name
   * @returns Initials string
   */
  getContactInitials(name: string): string {
    if (!name?.trim()) return '';
    
    const parts = this.splitNameIntoParts(name);
    return this.extractInitialsFromParts(parts);
  }

  /**
   * Splits a name into meaningful parts.
   * @param name - Full name
   * @returns Array of name parts
   */
  private splitNameIntoParts(name: string): string[] {
    return name.trim().split(' ').filter(Boolean);
  }

  /**
   * Extracts initials from name parts.
   * @param parts - Array of name parts
   * @returns Initials string
   */
  private extractInitialsFromParts(parts: string[]): string {
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Gets a color for contact avatar based on name.
   * @param name - Contact name
   * @returns Hex color string
   */
  getContactColor(name: string): string {
    if (!name?.trim()) return '#888';
    
    const colors = this.getColorPalette();
    const colorIndex = this.calculateColorIndex(name);
    return colors[colorIndex % colors.length];
  }

  /**
   * Gets the color palette for contact avatars.
   * @returns Array of hex color strings
   */
  private getColorPalette(): string[] {
    return [
      '#FFB900', '#D83B01', '#B50E0E', '#E81123',
      '#B4009E', '#5C2D91', '#0078D7', '#00B4FF',
      '#008272', '#107C10', '#7FBA00', '#F7630C',
      '#CA5010', '#EF6950', '#E74856', '#0099BC',
      '#7A7574', '#767676', '#FF8C00', '#E3008C',
      '#68217A', '#00188F', '#00BCF2', '#00B294',
      '#BAD80A', '#FFF100',
    ];
  }

  /**
   * Calculates color index based on first letter of name.
   * @param name - Contact name
   * @returns Color index
   */
  private calculateColorIndex(name: string): number {
    const letter = name.trim()[0].toUpperCase();
    return letter.charCodeAt(0) - 65; // A=0, B=1, etc.
  }
}


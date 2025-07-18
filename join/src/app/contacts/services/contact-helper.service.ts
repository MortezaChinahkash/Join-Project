import { Injectable } from '@angular/core';
import { Contact } from './contact-data.service';
/**
 * Service for contact-related helper functions.
 * Handles contact display logic, avatar generation, and initials calculation.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ContactHelperService {
  /**
   * Gets displayed contacts for task assignment (max 3).
   * @param assignedContacts - Array of assigned contact names
   * @param allContacts - Array of all available contacts
   * @returns Array of contacts to display
   */
  getDisplayedContacts(assignedContacts: string[], allContacts: Contact[]): Contact[] {
    const maxDisplay = 3;
    const contacts = assignedContacts
      .map(name => allContacts.find(c => c.name === name))
      .filter(contact => contact !== undefined) as Contact[];
    return contacts.slice(0, maxDisplay);
  }
  /**
   * Checks if there are remaining contacts not displayed.
   * @param assignedContacts - Array of assigned contact names
   * @param allContacts - Array of all available contacts
   * @returns True if there are remaining contacts
   */
  hasRemainingContacts(assignedContacts: string[], allContacts: Contact[]): boolean {
    const maxDisplay = 3;
    const contactCount = assignedContacts
      .map(name => allContacts.find(c => c.name === name))
      .filter(contact => contact !== undefined).length;
    return contactCount > maxDisplay;
  }
  /**
   * Gets count of remaining contacts not displayed.
   * @param assignedContacts - Array of assigned contact names
   * @param allContacts - Array of all available contacts
   * @returns Number of remaining contacts
   */
  getRemainingContactsCount(assignedContacts: string[], allContacts: Contact[]): number {
    const maxDisplay = 3;
    const contactCount = assignedContacts
      .map(name => allContacts.find(c => c.name === name))
      .filter(contact => contact !== undefined).length;
    return Math.max(0, contactCount - maxDisplay);
  }
  /**
   * Gets initials from contact name for avatar display.
   * @param name - Full name of the contact
   * @returns Initials (first letter of first and last name)
   */
  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }
  /**
   * Gets background color for contact avatar based on name.
   * Uses the same color logic as the contacts component.
   * @param name - Full name of the contact
   * @returns Hex color string
   */
  getInitialsColor(name: string): string {
    if (!name?.trim()) return '#888';
    const colors = [
      '#FFB900', '#D83B01', '#B50E0E', '#E81123',
      '#B4009E', '#5C2D91', '#0078D7', '#00B4FF',
      '#008272', '#107C10', '#7FBA00', '#F7630C',
      '#CA5010', '#EF6950', '#E74856', '#0099BC',
      '#7A7574', '#767676', '#FF8C00', '#E3008C',
      '#68217A', '#00188F', '#00BCF2', '#00B294',
      '#BAD80A', '#FFF100',
    ];
    const letter = name.trim()[0].toUpperCase();
    const colorIndex = letter.charCodeAt(0) - 65;
    return colors[colorIndex % colors.length];
  }
}

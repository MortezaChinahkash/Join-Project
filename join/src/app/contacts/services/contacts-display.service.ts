import { Injectable } from '@angular/core';
import { Contact } from './contact-data.service';
import { ContactOrganizationService } from './contact-organization.service';
import { AuthService, User } from '../../shared/services/auth.service';
/**
 * Service for managing contact display logic and formatting.
 * Handles contact presentation, truncation, colors, and display utilities.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })

export class ContactsDisplayService {
  /** Constructor initializes display service with organization and auth services */
  constructor(
    private organizationService: ContactOrganizationService,
    private authService: AuthService
  ) {}
  /**
   * Gets contact initials for display.
   * 
   * @param name - Contact name
   * @returns Initials string (1-2 characters)
   */
  getContactInitials(name: string): string {
    return this.organizationService.getContactInitials(name);
  }

  /**
   * Gets contact color for avatar background.
   * 
   * @param name - Contact name
   * @returns Hex color string
   */
  getContactColor(name: string): string {
    return this.organizationService.getContactColor(name);
  }

  /**
   * Truncates contact name if longer than specified length.
   * 
   * @param name - Contact name
   * @param maxLength - Maximum length before truncation (default: 25)
   * @returns Truncated name with ellipsis or original name
   */
  getTruncatedName(name: string, maxLength: number = 25): string {
    if (!name) return '';
    if (name.length > maxLength) {
      return name.substring(0, maxLength) + '...';
    }
    return name;
  }

  /**
   * Checks if a contact name is considered long.
   * 
   * @param name - Contact name
   * @param maxLength - Maximum length threshold (default: 25)
   * @returns True if name is longer than threshold
   */
  isLongName(name: string, maxLength: number = 25): boolean {
    return name?.length > maxLength;
  }

  /**
   * Truncates email if longer than specified length.
   * 
   * @param email - Email to truncate
   * @param maxLength - Maximum length before truncation (default: 23)
   * @returns Truncated email with ellipsis or original
   */
  truncateEmail(email: string, maxLength: number = 23): string {
    if (!email) return '';
    if (email.length <= maxLength) {
      return email;
    }
    const atIndex = email.lastIndexOf('@');
    if (atIndex > 0) {
      const localPart = email.substring(0, atIndex);
      const domain = email.substring(atIndex);
      if (domain.length < maxLength - 3) {
        const availableLocal = maxLength - domain.length - 3;
        return localPart.substring(0, availableLocal) + '...' + domain;
      }
    }
    return email.substring(0, maxLength - 3) + '...';
  }

  /**
   * Formats phone number for display.
   * 
   * @param phone - Phone number
   * @returns Formatted phone or 'N/A' if empty
   */
  formatPhone(phone?: string): string {
    if (!phone || phone.trim() === '' || phone === 'N/A') {
      return 'N/A';
    }
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {

      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  }

  /**
   * Gets display text for contact based on available information.
   * 
   * @param contact - Contact object
   * @returns Primary display text
   */
  getContactDisplayText(contact: Contact): string {
    return contact.name || contact.email || 'Unnamed Contact';
  }

  /**
   * Gets secondary display text for contact (usually email).
   * 
   * @param contact - Contact object
   * @returns Secondary display text
   */
  getContactSecondaryText(contact: Contact): string {
    if (contact.name && contact.email) {
      return this.truncateEmail(contact.email);
    }
    return this.formatPhone(contact.phone);
  }

  /**
   * Gets the current logged-in user.
   * 
   * @returns Current user or null
   */
  getCurrentUser(): User | null {
    return this.authService.currentUser;
  }

  /**
   * Gets the display name for the current user.
   * 
   * @returns Display name or email
   */
  getCurrentUserDisplayName(): string {
    const user = this.getCurrentUser();
    return user?.name || user?.email || 'Unknown User';
  }

  /**
   * Creates a contact-like object for the current user.
   * 
   * @returns Current user as contact object
   */
  getCurrentUserAsContact(): Contact | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    return {
      id: 'current-user',
      name: user.name || user.email || 'Current User',
      email: user.email || '',
      phone: '',
      isCurrentUser: true
    };
  }

  /**
   * Checks if a contact is the current user.
   * 
   * @param contact - Contact to check
   * @returns True if contact is current user
   */
  isCurrentUserContact(contact: Contact): boolean {
    return contact.isCurrentUser === true || contact.id === 'current-user';
  }

  /**
   * Gets contact avatar style object.
   * 
   * @param contact - Contact object
   * @returns Style object with background color
   */
  getContactAvatarStyle(contact: Contact): { backgroundColor: string } {
    return {
      backgroundColor: this.getContactColor(contact.name)
    };
  }

  /**
   * Gets contact status text (current user vs regular contact).
   * 
   * @param contact - Contact object
   * @returns Status text
   */
  getContactStatusText(contact: Contact): string {
    return this.isCurrentUserContact(contact) ? 'You' : 'Contact';
  }

  /**
   * Formats contact for list display.
   * 
   * @param contact - Contact object
   * @returns Formatted contact display object
   */
  formatContactForDisplay(contact: Contact): {
    initials: string;
    name: string;
    email: string;
    phone: string;
    color: string;
    isCurrentUser: boolean;
    displayName: string;
    truncatedName: string;
    truncatedEmail: string;
  } {
    return this.buildContactDisplayObject(contact);
  }

  /**
   * Builds the complete contact display object.
   * 
   * @param contact - Contact object
   * @returns Formatted contact display object
   * @private
   */
  private buildContactDisplayObject(contact: Contact): {
    initials: string;
    name: string;
    email: string;
    phone: string;
    color: string;
    isCurrentUser: boolean;
    displayName: string;
    truncatedName: string;
    truncatedEmail: string;
  } {
    return {
      initials: this.getContactInitials(contact.name),
      name: contact.name,
      email: contact.email,
      phone: this.formatPhone(contact.phone),
      color: this.getContactColor(contact.name),
      isCurrentUser: this.isCurrentUserContact(contact),
      displayName: this.getContactDisplayText(contact),
      truncatedName: this.getTruncatedName(contact.name),
      truncatedEmail: this.truncateEmail(contact.email)
    };
  }

  /**
   * Gets contact list item class names based on state.
   * 
   * @param contact - Contact object
   * @param isSelected - Whether contact is selected
   * @returns CSS class names
   */
  getContactItemClasses(contact: Contact, isSelected: boolean = false): string[] {
    const classes = ['contact-item'];
    if (isSelected) {
      classes.push('selected');
    }
    if (this.isCurrentUserContact(contact)) {
      classes.push('current-user');
    }
    return classes;
  }

  /**
   * Gets contact search text for filtering.
   * 
   * @param contact - Contact object
   * @returns Searchable text
   */
  getContactSearchText(contact: Contact): string {
    return `${contact.name} ${contact.email} ${contact.phone || ''}`.toLowerCase();
  }

  /**
   * Validates if contact has minimum required data for display.
   * 
   * @param contact - Contact object
   * @returns True if contact has minimum display data
   */
  hasMinimumDisplayData(contact: Contact): boolean {
    return !!(contact.name?.trim() || contact.email?.trim());
  }

  /**
   * Gets contact priority for sorting (current user first).
   * 
   * @param contact - Contact object
   * @returns Sort priority (lower = higher priority)
   */
  getContactSortPriority(contact: Contact): number {
    return this.isCurrentUserContact(contact) ? 0 : 1;
  }

  /**
   * Formats contact tooltip text.
   * 
   * @param contact - Contact object
   * @returns Tooltip text with contact details
   */
  getContactTooltip(contact: Contact): string {
    const parts = [contact.name];
    if (contact.email) {
      parts.push(contact.email);
    }
    if (contact.phone && contact.phone !== 'N/A') {
      parts.push(this.formatPhone(contact.phone));
    }
    if (this.isCurrentUserContact(contact)) {
      parts.push('(You)');
    }
    return parts.join('\n');
  }

  /**
   * Gets contact accessibility label.
   * 
   * @param contact - Contact object
   * @returns Accessibility label text
   */
  getContactAriaLabel(contact: Contact): string {
    const name = contact.name || 'Unnamed contact';
    const status = this.isCurrentUserContact(contact) ? ' (current user)' : '';
    return `${name}${status}`;
  }

  /**
   * Static method for getting contact initials (for external use).
   * 
   * @param name - Contact name
   * @returns Contact initials
   */
  static getInitials(name: string): string {
    const service = new ContactOrganizationService();
    return service.getContactInitials(name);
  }

  /**
   * Static method for getting contact color (for external use).
   * 
   * @param name - Contact name
   * @returns Hex color string
   */
  static getInitialsColor(name: string): string {
    const service = new ContactOrganizationService();
    return service.getContactColor(name);
  }

  /**
   * Cleanup method for service destruction.
   */
  cleanup(): void {
  }
}

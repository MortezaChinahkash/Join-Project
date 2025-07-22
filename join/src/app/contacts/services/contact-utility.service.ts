import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ContactsDisplayService } from './contacts-display.service';
import { ContactsFormService } from './contacts-form.service';

/**
 * Service providing utility methods for contact display, formatting, and form validation.
 * Centralizes common utility functions used across contact components.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class ContactUtilityService {

  /**
   * Initializes the contact utility service with required dependencies.
   * 
   * @param displayService - Service for display operations
   * @param formService - Service for form operations
   */
  constructor(
    private displayService: ContactsDisplayService,
    private formService: ContactsFormService
  ) {}

  /**
   * Gets the contact form instance.
   * 
   * @returns FormGroup instance
   */
  getContactForm(): FormGroup {
    return this.formService.getForm();
  }

  /**
   * Gets contact initials for display.
   * 
   * @param name - Contact name
   * @returns Initials string
   */
  getInitials(name: string): string {
    return this.displayService.getContactInitials(name);
  }

  /**
   * Gets contact color for avatar.
   * 
   * @param name - Contact name
   * @returns Hex color string
   */
  getInitialsColor(name: string): string {
    return this.displayService.getContactColor(name);
  }

  /**
   * Truncates contact name if longer than 25 characters.
   * 
   * @param name - Contact name
   * @returns Truncated name with ellipsis or original name
   */
  getTruncatedName(name: string): string {
    return this.displayService.getTruncatedName(name);
  }

  /**
   * Checks if a contact name is considered long (>25 characters).
   * 
   * @param name - Contact name
   * @returns True if name is longer than 25 characters
   */
  isLongName(name: string): boolean {
    return this.displayService.isLongName(name);
  }

  /**
   * Truncates email if longer than 23 characters with ellipsis ending.
   * 
   * @param email - Email to truncate
   * @returns Truncated email or original if short enough
   */
  truncateEmail(email: string): string {
    return this.displayService.truncateEmail(email);
  }

  /**
   * Gets the current logged-in user.
   * 
   * @returns Current user or null
   */
  getCurrentUser() {
    return this.displayService.getCurrentUser();
  }

  /**
   * Gets the display name for the current user.
   * 
   * @returns Display name or email
   */
  getCurrentUserDisplayName(): string {
    return this.displayService.getCurrentUserDisplayName();
  }

  /**
   * Checks if a specific field has errors.
   * 
   * @param fieldName - Name of the field to check
   * @returns True if field has errors and is touched
   */
  hasFieldError(fieldName: string): boolean {
    return this.formService.hasFieldError(fieldName);
  }

  /**
   * Gets error message for a specific field.
   * 
   * @param fieldName - Name of the field
   * @returns Error message or empty string
   */
  getFieldError(fieldName: string): string {
    return this.formService.getFieldError(fieldName);
  }

  /**
   * Static method for getting contact initials (for external use).
   * 
   * @param name - Contact name
   * @returns Contact initials
   */
  static getInitials(name: string): string {
    return ContactsDisplayService.getInitials(name);
  }

  /**
   * Static method for getting contact color (for external use).
   * 
   * @param name - Contact name
   * @returns Hex color string
   */
  static getInitialsColor(name: string): string {
    return ContactsDisplayService.getInitialsColor(name);
  }
}

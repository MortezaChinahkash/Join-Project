import { Injectable } from '@angular/core';
import { Contact } from './contact-data.service';
import { ContactOrganizationService } from './contact-organization.service';

/**
 * Service for contact utility functions and operations.
 * Handles validation, search, statistics, bulk operations, and export functions.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class ContactsUtilityService {
  /** Constructor initializes utility service with organization service */
  constructor(private organizationService: ContactOrganizationService) {}

  /**
   * Validates contact data before operations.
   * 
   * @param contactData - Contact data to validate
   * @returns Validation result
   */
  validateContactData(contactData: Partial<Contact>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    this.validateRequiredFields(contactData, errors);
    this.validateEmailField(contactData, errors);
    this.validateNameLength(contactData, errors);
    this.validatePhoneField(contactData, errors);
    return this.buildValidationResult(errors);
  }

  /**
   * Validates required contact fields.
   * 
   * @param contactData - Contact data to validate
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateRequiredFields(contactData: Partial<Contact>, errors: string[]): void {
    if (!contactData.name?.trim()) {
      errors.push('Name is required');
    }
    if (!contactData.email?.trim()) {
      errors.push('Email is required');
    }
  }

  /**
   * Validates email field format.
   * 
   * @param contactData - Contact data to validate
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateEmailField(contactData: Partial<Contact>, errors: string[]): void {
    if (contactData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactData.email)) {
        errors.push('Invalid email format');
      }
    }
  }

  /**
   * Validates name field length.
   * 
   * @param contactData - Contact data to validate
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateNameLength(contactData: Partial<Contact>, errors: string[]): void {
    if (contactData.name && contactData.name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
  }

  /**
   * Validates phone field format.
   * 
   * @param contactData - Contact data to validate
   * @param errors - Array to collect validation errors
   * @private
   */
  private validatePhoneField(contactData: Partial<Contact>, errors: string[]): void {
    if (contactData.phone && contactData.phone !== 'N/A') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = contactData.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('Invalid phone number format');
      }
    }
  }

  /**
   * Builds the final validation result.
   * 
   * @param errors - Array of validation errors
   * @returns Validation result object
   * @private
   */
  private buildValidationResult(errors: string[]): { isValid: boolean; errors: string[] } {
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Searches contacts by name or email.
   * 
   * @param contacts - Contacts array to search
   * @param query - Search query
   * @returns Filtered contacts array
   */
  searchContacts(contacts: Contact[], query: string): Contact[] {
    if (!query?.trim()) {
      return contacts;
    }
    const searchTerm = query.toLowerCase().trim();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Gets contact statistics.
   * 
   * @param contacts - Contacts array
   * @returns Contact statistics
   */
  getContactStats(contacts: Contact[]): {
    total: number;
    withPhone: number;
    withoutPhone: number;
    groups: number;
  } {
    const withPhone = contacts.filter(c => c.phone && c.phone !== 'N/A').length;
    const groups = Object.keys(this.organizationService.groupContactsByLetter(contacts)).length;
    return {
      total: contacts.length,
      withPhone,
      withoutPhone: contacts.length - withPhone,
      groups
    };
  }

  /**
   * Bulk creates contacts from an array.
   * 
   * @param contactsData - Array of contact data
   * @param createContactFn - Function to create individual contacts
   * @returns Promise with results
   */
  async bulkCreateContacts(
    contactsData: Partial<Contact>[],
    createContactFn: (contactData: Partial<Contact>) => Promise<Contact>
  ): Promise<{
    successful: Contact[];
    failed: { data: Partial<Contact>; error: string }[];
  }> {
    const results = this.initializeBulkCreateResults();
    await this.processBulkContactCreation(contactsData, createContactFn, results);
    return results;
  }

  /**
   * Initializes the results structure for bulk contact creation.
   * 
   * @returns Initial results object
   * @private
   */
  private initializeBulkCreateResults(): {
    successful: Contact[];
    failed: { data: Partial<Contact>; error: string }[];
  } {
    return {
      successful: [],
      failed: []
    };
  }

  /**
   * Processes the bulk creation of contacts.
   * 
   * @param contactsData - Array of contact data to process
   * @param createContactFn - Function to create individual contacts
   * @param results - Results object to populate
   * @private
   */
  private async processBulkContactCreation(
    contactsData: Partial<Contact>[],
    createContactFn: (contactData: Partial<Contact>) => Promise<Contact>,
    results: { successful: Contact[]; failed: { data: Partial<Contact>; error: string }[] }
  ): Promise<void> {
    for (const contactData of contactsData) {
      await this.processSingleContactCreation(contactData, createContactFn, results);
    }
  }

  /**
   * Processes creation of a single contact in bulk operation.
   * 
   * @param contactData - Contact data to create
   * @param createContactFn - Function to create individual contacts
   * @param results - Results object to update
   * @private
   */
  private async processSingleContactCreation(
    contactData: Partial<Contact>,
    createContactFn: (contactData: Partial<Contact>) => Promise<Contact>,
    results: { successful: Contact[]; failed: { data: Partial<Contact>; error: string }[] }
  ): Promise<void> {
    try {
      const newContact = await createContactFn(contactData);
      results.successful.push(newContact);
    } catch (error) {
      this.handleBulkCreationError(contactData, error, results);
    }
  }

  /**
   * Handles errors during bulk contact creation.
   * 
   * @param contactData - Contact data that failed
   * @param error - Error that occurred
   * @param results - Results object to update
   * @private
   */
  private handleBulkCreationError(
    contactData: Partial<Contact>,
    error: any,
    results: { successful: Contact[]; failed: { data: Partial<Contact>; error: string }[] }
  ): void {
    results.failed.push({
      data: contactData,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  /**
   * Exports contacts to a specific format.
   * 
   * @param contacts - Contacts to export
   * @param format - Export format
   * @returns Formatted contact data
   */
  exportContacts(contacts: Contact[], format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(contacts, null, 2);
    }
    if (format === 'csv') {
      const headers = 'Name,Email,Phone\n';
      const rows = contacts.map(contact =>
        `"${contact.name}","${contact.email}","${contact.phone}"`
      ).join('\n');
      return headers + rows;
    }
    throw new Error('Unsupported export format');
  }
}

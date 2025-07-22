import { Injectable } from '@angular/core';
import { Contact } from './contact-data.service';
import { ContactsFormService } from './contacts-form.service';
import { ContactsCrudService } from './contacts-crud.service';
import { ContactsStateService } from './contacts-state.service';
import { ContactsDisplayService } from './contacts-display.service';

/**
 * Service for handling complex contact operations including form processing.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from ContactsService
 */
@Injectable({ providedIn: 'root' })
export class ContactOperationsService {

  /**
   * Initializes the contact operations service with required dependencies.
   * 
   * @param formService - Service for form operations
   * @param crudService - Service for CRUD operations
   * @param stateService - Service for managing contact state
   * @param displayService - Service for display operations
   */
  constructor(
    private formService: ContactsFormService,
    private crudService: ContactsCrudService,
    private stateService: ContactsStateService,
    private displayService: ContactsDisplayService
  ) {}

  /**
   * Processes contact form submission for add or update operations.
   * Handles validation, form preparation, operation execution, and error handling.
   * 
   * @param operation - Type of operation ('add' or 'update')
   * @param contacts - Current contacts array
   * @param selectedContact - Currently selected contact (for updates)
   * @param onSuccess - Callback function for successful operations
   * @param onError - Callback function for handling errors
   */
  async processContactForm(
    operation: 'add' | 'update',
    contacts: Contact[],
    selectedContact: Contact | null,
    onSuccess: (contact: Contact, operation: 'add' | 'update') => void,
    onError: (operation: string, error: any) => void
  ): Promise<void> {
    if (!this.formService.validateForm()) return;
    
    const formData = this.formService.prepareFormData();
    
    try {
      if (operation === 'add') {
        const newContact = await this.performAddContact(formData, contacts);
        onSuccess(newContact, 'add');
      } else {
        const updatedContact = await this.performUpdateContact(formData, selectedContact);
        onSuccess(updatedContact, 'update');
      }
    } catch (error) {
      onError(operation, error);
    }
  }

  /**
   * Performs add contact operation with validation and creation.
   * 
   * @param contactData - Contact data to add
   * @param contacts - Current contacts array
   * @returns Promise resolving to the created contact
   * @private
   */
  private async performAddContact(contactData: Partial<Contact>, contacts: Contact[]): Promise<Contact> {
    return await this.crudService.createContact(contactData, contacts);
  }

  /**
   * Performs update contact operation with validation and updating.
   * 
   * @param contactData - Contact data to update
   * @param selectedContact - Contact to update
   * @returns Promise resolving to the updated contact
   * @throws Error if no contact ID is available
   * @private
   */
  private async performUpdateContact(contactData: Partial<Contact>, selectedContact: Contact | null): Promise<Contact> {
    if (!selectedContact?.id) {
      throw new Error('No contact ID for update');
    }
    return await this.crudService.updateContact(selectedContact.id, contactData);
  }

  /**
   * Handles successful contact addition with array updates and UI feedback.
   * 
   * @param contacts - Current contacts array
   * @param newContact - Newly created contact
   * @param groupContacts - Function to group contacts
   * @param closeOverlay - Function to close add overlay
   * @param showSuccess - Function to show success message
   * @param selectContact - Function to select contact
   * @returns Updated contacts array
   */
  handleContactAdded(
    contacts: Contact[],
    newContact: Contact,
    groupContacts: () => void,
    closeOverlay: () => void,
    showSuccess: (message: string) => void,
    selectContact: (contact: Contact) => void
  ): Contact[] {
    const updatedContacts = this.crudService.addContactToArray(contacts, newContact);
    groupContacts();
    closeOverlay();
    showSuccess('Contact successfully created!');
    selectContact(newContact);
    return updatedContacts;
  }

  /**
   * Handles successful contact update with object updates and UI feedback.
   * 
   * @param contacts - Current contacts array
   * @param selectedContact - Contact that was updated
   * @param updatedContact - Updated contact data
   * @param groupContacts - Function to group contacts
   * @param closeOverlay - Function to close edit overlay
   * @param showSuccess - Function to show success message
   * @returns Updated contacts array
   */
  handleContactUpdated(
    contacts: Contact[],
    selectedContact: Contact | null,
    updatedContact: Contact,
    groupContacts: () => void,
    closeOverlay: () => void,
    showSuccess: (message: string) => void
  ): Contact[] {
    if (selectedContact) {
      Object.assign(selectedContact, updatedContact);
      let updatedContacts = contacts;
      if (!this.displayService.isCurrentUserContact(selectedContact)) {
        updatedContacts = this.crudService.updateContactInArray(contacts, selectedContact);
      }
      groupContacts();
      closeOverlay();
      showSuccess('Contact successfully updated!');
      return updatedContacts;
    }
    return contacts;
  }

  /**
   * Handles successful contact deletion with array updates and UI feedback.
   * 
   * @param contacts - Current contacts array
   * @param contactId - ID of deleted contact
   * @param groupContacts - Function to group contacts
   * @param showSuccess - Function to show success message
   * @param clearSelected - Function to clear selected contact
   * @returns Updated contacts array
   */
  handleContactDeleted(
    contacts: Contact[],
    contactId: string,
    groupContacts: () => void,
    showSuccess: (message: string) => void,
    clearSelected: () => void
  ): Contact[] {
    const updatedContacts = this.crudService.removeContactFromArray(contacts, contactId);
    groupContacts();
    showSuccess('Contact successfully deleted!');
    clearSelected();
    return updatedContacts;
  }

  /**
   * Performs contact deletion with error handling and animations.
   * 
   * @param selectedContact - Contact to delete
   * @param onSuccess - Success callback
   * @param onError - Error callback
   */
  async deleteContact(
    selectedContact: Contact | null,
    onSuccess: (contactId: string) => void,
    onError: (error: any) => void
  ): Promise<void> {
    if (!selectedContact?.id) return;
    
    this.stateService.suppressAnimations();
    
    try {
      await this.crudService.deleteContact(selectedContact.id);
      onSuccess(selectedContact.id);
    } catch (error) {
      onError(error);
    }
  }
}

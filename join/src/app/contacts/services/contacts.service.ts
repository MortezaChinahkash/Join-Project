import { Injectable, OnDestroy } from '@angular/core';
import { Contact, ContactDataService } from './contact-data.service';
import { ContactOrganizationService } from './contact-organization.service';
import { ContactsStateService } from './contacts-state.service';
import { ContactsFormService } from './contacts-form.service';
import { ContactsCrudService } from './contacts-crud.service';
import { ContactsDisplayService } from './contacts-display.service';
import { ContactOperationsService } from './contact-operations.service';
import { ContactInitializationService } from './contact-initialization.service';
import { ContactNavigationService } from './contact-navigation.service';

/**
 * Main orchestrator service for contacts functionality.
 * Coordinates all specialized contact services and provides unified interface.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class ContactsService implements OnDestroy {
  private contacts: Contact[] = [];
  private groupedContacts: { [key: string]: Contact[] } = {};
  private selectedContact: Contact | null = null;
  private initializationCleanup?: () => void;

  constructor(
    private organizationService: ContactOrganizationService,
    private stateService: ContactsStateService,
    private formService: ContactsFormService,
    private crudService: ContactsCrudService,
    private displayService: ContactsDisplayService,
    private contactOperations: ContactOperationsService,
    private contactInitialization: ContactInitializationService,
    private contactNavigation: ContactNavigationService
  ) {}
  
  /** Gets all contacts array */
  get allContacts(): Contact[] { return this.contacts; }

  /** Gets grouped contacts by first letter */
  get contactGroups(): { [key: string]: Contact[] } { return this.groupedContacts; }

  /** Gets currently selected contact */
  get currentContact(): Contact | null { return this.selectedContact; }

  /**
   * Initializes the contacts service.
   */
  initialize(): void {
    this.initializationCleanup = this.contactInitialization.initialize(
      (contacts, groupedContacts) => this.handleContactsLoaded(contacts, groupedContacts),
      (error) => this.handleLoadError(error)
    );
  }

  /**
   * Handles successful contact loading from initialization service.
   * 
   * @param contacts - Loaded and processed contacts array
   * @param groupedContacts - Pre-grouped contacts by letter
   * @private
   */
  private handleContactsLoaded(contacts: Contact[], groupedContacts: { [key: string]: Contact[] }): void {
    this.contacts = contacts;
    this.groupedContacts = groupedContacts;
  }

  /**
   * Handles contact loading errors from initialization service.
   * 
   * @param error - Error object
   * @private
   */
  private handleLoadError(error: any): void {
    console.error('Error loading contacts:', error);
  }

  /**
   * Groups contacts by first letter of name.
   */
  private groupContacts(): void {
    this.groupedContacts = this.organizationService.groupContactsByLetter(this.contacts);
  }

  /**
   * Sets up window resize listener for responsive behavior.
   */
  private setupResizeListener(): void {
    // Cleanup handling is now managed by ContactInitializationService
  }

  /**
   * Handles add contact form submission.
   */
  async onSubmitAddContact(): Promise<void> {
    await this.contactOperations.processContactForm(
      'add',
      this.contacts,
      this.selectedContact,
      (contact, operation) => this.handleOperationSuccess(contact, operation),
      (operation, error) => this.handleOperationError(operation, error)
    );
  }

  /**
   * Handles update contact form submission.
   */
  async onSubmitUpdateContact(): Promise<void> {
    await this.contactOperations.processContactForm(
      'update',
      this.contacts,
      this.selectedContact,
      (contact, operation) => this.handleOperationSuccess(contact, operation),
      (operation, error) => this.handleOperationError(operation, error)
    );
  }

  /**
   * Deletes the currently selected contact.
   */
  async deleteContact(): Promise<void> {
    await this.contactOperations.deleteContact(
      this.selectedContact,
      (contactId) => this.handleDeleteSuccess(contactId),
      (error) => this.handleDeleteError(error)
    );
  }

  /**
   * Selects a contact and handles mobile view.
   * 
   * @param contact - Contact to select
   */
  selectContact(contact: Contact): void {
    this.contactNavigation.selectContact(
      contact,
      (contact) => this.selectedContact = contact
    );
  }

  /**
   * Handles successful contact operations.
   * 
   * @param contact - The contact that was processed
   * @param operation - The operation that was performed
   * @private
   */
  private handleOperationSuccess(contact: Contact, operation: 'add' | 'update'): void {
    if (operation === 'add') {
      this.handleAddContactSuccess(contact);
    } else {
      this.handleUpdateContactSuccess(contact);
    }
  }

  /**
   * Handles successful contact addition.
   * 
   * @param contact - The contact that was added
   * @private
   */
  private handleAddContactSuccess(contact: Contact): void {
    this.contacts = this.contactOperations.handleContactAdded(
      this.contacts,
      contact,
      () => this.groupContacts(),
      () => this.contactNavigation.closeAddContactOverlay(),
      (message) => this.showAddSuccessMessage(message),
      (contact) => this.selectContact(contact)
    );
  }

  /**
   * Handles successful contact update.
   * 
   * @param contact - The contact that was updated
   * @private
   */
  private handleUpdateContactSuccess(contact: Contact): void {
    this.contacts = this.contactOperations.handleContactUpdated(
      this.contacts,
      this.selectedContact,
      contact,
      () => this.groupContacts(),
      () => this.contactNavigation.closeEditContactOverlay(),
      (message) => this.showUpdateSuccessMessage(message)
    );
  }

  /**
   * Shows success message for contact addition.
   * 
   * @param message - Success message to display
   * @private
   */
  private showAddSuccessMessage(message: string): void {
    this.contactNavigation.showSuccessMessage(message, () => {});
  }

  /**
   * Shows success message for contact update.
   * 
   * @param message - Success message to display
   * @private
   */
  private showUpdateSuccessMessage(message: string): void {
    this.contactNavigation.showSuccessMessage(message, () => {});
  }

  /**
   * Handles successful contact deletion.
   * 
   * @param contactId - ID of the deleted contact
   * @private
   */
  private handleDeleteSuccess(contactId: string): void {
    this.contacts = this.contactOperations.handleContactDeleted(
      this.contacts,
      contactId,
      () => this.groupContacts(),
      (message) => this.contactNavigation.showSuccessMessage(message, () => {}),
      () => this.clearSelectedContactAsync()
    );
  }

  /**
   * Handles operation errors.
   * 
   * @param operation - Type of operation that failed
   * @param error - Error object
   */
  private handleOperationError(operation: string, error: any): void {
    console.error(`Error ${operation} contact:`, error);
    this.stateService.enableAnimations();
  }

  /**
   * Handles delete operation errors.
   * 
   * @param error - Error object
   */
  private handleDeleteError(error: any): void {
    console.error('Error deleting contact:', error);
    this.stateService.enableAnimations();
  }

  /**
   * Clears selected contact asynchronously.
   */
  private clearSelectedContactAsync(): void {
    this.contactNavigation.clearSelectedContactAsync(() => {
      this.selectedContact = null;
    });
  }

  /**
   * Angular lifecycle hook - component cleanup.
   */
  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Cleanup method for service destruction.
   */
  cleanup(): void {
    this.initializationCleanup?.();
    this.stateService.cleanup();
    this.formService.cleanup();
    this.displayService.cleanup();
  }
}

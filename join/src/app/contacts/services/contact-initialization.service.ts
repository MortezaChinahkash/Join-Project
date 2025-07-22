import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Contact, ContactDataService } from './contact-data.service';
import { ContactsStateService } from './contacts-state.service';
import { ContactsCrudService } from './contacts-crud.service';
import { ContactOrganizationService } from './contact-organization.service';

/**
 * Service for handling contact initialization and loading operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from ContactsService
 */
@Injectable({ providedIn: 'root' })
export class ContactInitializationService implements OnDestroy {
  private contactsSubscription?: Subscription;
  private resizeCleanup?: () => void;

  constructor(
    private dataService: ContactDataService,
    private stateService: ContactsStateService,
    private crudService: ContactsCrudService,
    private organizationService: ContactOrganizationService
  ) {}

  /**
   * Initializes the contacts system with state, listeners, and data loading.
   * Coordinates all initialization steps in the correct order.
   * 
   * @param onContactsLoaded - Callback when contacts are successfully loaded
   * @param onLoadError - Callback when contact loading fails
   * @returns Cleanup function for resize listener
   */
  initialize(
    onContactsLoaded: (contacts: Contact[], groupedContacts: { [key: string]: Contact[] }) => void,
    onLoadError: (error: any) => void
  ): () => void | undefined {
    this.stateService.initializeState();
    this.resizeCleanup = this.setupResizeListener();
    this.loadContacts(onContactsLoaded, onLoadError);
    return this.resizeCleanup;
  }

  /**
   * Loads contacts from the data service and processes them.
   * Handles subscription management and error handling.
   * 
   * @param onContactsLoaded - Callback when contacts are successfully loaded
   * @param onLoadError - Callback when contact loading fails
   * @private
   */
  private loadContacts(
    onContactsLoaded: (contacts: Contact[], groupedContacts: { [key: string]: Contact[] }) => void,
    onLoadError: (error: any) => void
  ): void {
    this.contactsSubscription = this.dataService.loadContactsFromFirestore()
      .subscribe({
        next: (contacts) => this.handleContactsLoaded(contacts, onContactsLoaded),
        error: (error) => this.handleLoadError(error, onLoadError)
      });
  }

  /**
   * Handles successful contact loading with processing and grouping.
   * Enriches contacts with current user and organizes them by letter.
   * 
   * @param contacts - Raw contacts from data service
   * @param onContactsLoaded - Callback to notify parent service
   * @private
   */
  private handleContactsLoaded(
    contacts: Contact[],
    onContactsLoaded: (contacts: Contact[], groupedContacts: { [key: string]: Contact[] }) => void
  ): void {
    const processedContacts = this.crudService.getAllContactsWithCurrentUser(contacts);
    const groupedContacts = this.organizationService.groupContactsByLetter(processedContacts);
    onContactsLoaded(processedContacts, groupedContacts);
  }

  /**
   * Handles contact loading errors with logging and callback notification.
   * 
   * @param error - Error object from the loading operation
   * @param onLoadError - Callback to notify parent service of error
   * @private
   */
  private handleLoadError(error: any, onLoadError: (error: any) => void): void {
    console.error('Error loading contacts:', error);
    onLoadError(error);
  }

  /**
   * Sets up window resize listener for responsive behavior.
   * Creates and returns cleanup function for proper resource management.
   * 
   * @returns Cleanup function to remove resize listener
   * @private
   */
  private setupResizeListener(): () => void {
    return this.stateService.setupResizeListener();
  }

  /**
   * Reloads contacts and reprocesses grouping.
   * Useful for refreshing data after external changes.
   * 
   * @param onContactsLoaded - Callback when contacts are successfully reloaded
   * @param onLoadError - Callback when contact reloading fails
   */
  reloadContacts(
    onContactsLoaded: (contacts: Contact[], groupedContacts: { [key: string]: Contact[] }) => void,
    onLoadError: (error: any) => void
  ): void {
    this.cleanup();
    this.loadContacts(onContactsLoaded, onLoadError);
  }

  /**
   * Regrouping contacts by letter after data changes.
   * Used when contacts array is modified externally.
   * 
   * @param contacts - Current contacts array to regroup
   * @returns Newly grouped contacts by first letter
   */
  regroupContacts(contacts: Contact[]): { [key: string]: Contact[] } {
    return this.organizationService.groupContactsByLetter(contacts);
  }

  /**
   * Cleanup method for service destruction.
   * Unsubscribes from observables and removes event listeners.
   */
  cleanup(): void {
    this.contactsSubscription?.unsubscribe();
    this.resizeCleanup?.();
  }

  /**
   * Angular lifecycle hook - component cleanup.
   */
  ngOnDestroy(): void {
    this.cleanup();
  }
}

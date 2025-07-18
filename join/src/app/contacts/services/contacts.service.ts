import { Injectable, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { Contact, ContactDataService } from './contact-data.service';
import { ContactOrganizationService } from './contact-organization.service';
import { ContactUiService } from './contact-ui.service';
import { ContactsStateService } from './contacts-state.service';
import { ContactsFormService } from './contacts-form.service';
import { ContactsCrudService } from './contacts-crud.service';
import { ContactsDisplayService } from './contacts-display.service';
import { AuthService } from '../../shared/services/auth.service';
/**
 * Main orchestrator service for contacts functionality.
 * Coordinates all specialized contact services and provides unified interface.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class ContactsService implements OnDestroy {
  // Data state
  private contacts: Contact[] = [];
  private groupedContacts: { [key: string]: Contact[] } = {};
  private selectedContact: Contact | null = null;
  // Subscriptions
  private contactsSubscription?: Subscription;
  private resizeCleanup?: () => void;
  constructor(
    private dataService: ContactDataService,
    private organizationService: ContactOrganizationService,
    private uiService: ContactUiService,
    private stateService: ContactsStateService,
    private formService: ContactsFormService,
    private crudService: ContactsCrudService,
    private displayService: ContactsDisplayService,
    private authService: AuthService
  ) {}
  // Expose state observables
  get showAddContactOverlay$(): Observable<boolean> { return this.stateService.showAddContactOverlay$; }
  get showEditContactOverlay$(): Observable<boolean> { return this.stateService.showEditContactOverlay$; }
  get showMobileMoreMenu$(): Observable<boolean> { return this.stateService.showMobileMoreMenu$; }
  get contactSuccessMessageOverlay$(): Observable<boolean> { return this.stateService.contactSuccessMessageOverlay$; }
  get isMobileView$(): Observable<boolean> { return this.stateService.isMobileView$; }
  get showMobileSingleContact$(): Observable<boolean> { return this.stateService.showMobileSingleContact$; }
  get suppressAnimation$(): Observable<boolean> { return this.stateService.suppressAnimation$; }
  get contactSuccessMessageText$(): Observable<string> { return this.stateService.contactSuccessMessageText$; }
  // Expose state properties
  get showAddContactOverlay(): boolean { return this.stateService.showAddContactOverlay; }
  get showEditContactOverlay(): boolean { return this.stateService.showEditContactOverlay; }
  get showMobileMoreMenu(): boolean { return this.stateService.showMobileMoreMenu; }
  get contactSuccessMessageOverlay(): boolean { return this.stateService.contactSuccessMessageOverlay; }
  get isMobileView(): boolean { return this.stateService.isMobileView; }
  get showMobileSingleContact(): boolean { return this.stateService.showMobileSingleContact; }
  get suppressAnimation(): boolean { return this.stateService.suppressAnimation; }
  get contactSuccessMessageText(): string { return this.stateService.contactSuccessMessageText; }
  // Expose data properties
  get allContacts(): Contact[] { return this.contacts; }
  get contactGroups(): { [key: string]: Contact[] } { return this.groupedContacts; }
  get currentContact(): Contact | null { return this.selectedContact; }
  /**
   * Initializes the contacts service.
   */
  initialize(): void {
    this.stateService.initializeState();
    this.setupResizeListener();
    this.loadContacts();
  }
  /**
   * Loads contacts from the data service.
   */
  private loadContacts(): void {
    this.contactsSubscription = this.dataService.loadContactsFromFirestore()
      .subscribe({
        next: (contacts) => this.handleContactsLoaded(contacts),
        error: (error) => this.handleLoadError(error)
      });
  }
  /**
   * Handles successful contact loading.
   * 
   * @param contacts - Loaded contacts array
   */
  private handleContactsLoaded(contacts: Contact[]): void {
    this.contacts = this.crudService.getAllContactsWithCurrentUser(contacts);
    this.groupContacts();
  }
  /**
   * Handles contact loading errors.
   * 
   * @param error - Error object
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
    this.resizeCleanup = this.stateService.setupResizeListener();
  }
  // Form Management Methods
  /**
   * Gets the contact form instance.
   * 
   * @returns FormGroup instance
   */
  getContactForm(): FormGroup {
    return this.formService.getForm();
  }
  /**
   * Opens the add contact overlay and resets form.
   */
  openAddContactOverlay(): void {
    this.stateService.openAddContactOverlay();
    this.formService.resetForm();
  }
  /**
   * Closes the add contact overlay.
   */
  closeAddContactOverlay(): void {
    this.stateService.closeAddContactOverlay();
  }
  /**
   * Opens edit contact overlay for a specific contact.
   * 
   * @param contact - Contact to edit
   */
  openEditContactOverlay(contact: Contact): void {
    this.stateService.openEditContactOverlay();
    this.selectedContact = contact;
    this.formService.populateForm(contact);
  }
  /**
   * Closes the edit contact overlay.
   */
  closeEditContactOverlay(): void {
    this.stateService.closeEditContactOverlay();
  }
  // CRUD Operations
  /**
   * Handles add contact form submission.
   */
  async onSubmitAddContact(): Promise<void> {
    await this.processContactForm('add');
  }
  /**
   * Handles update contact form submission.
   */
  async onSubmitUpdateContact(): Promise<void> {
    await this.processContactForm('update');
  }
  /**
   * Processes contact form submission for add or update operations.
   * 
   * @param operation - Type of operation ('add' or 'update')
   */
  private async processContactForm(operation: 'add' | 'update'): Promise<void> {
    if (!this.formService.validateForm()) return;
    const formData = this.formService.prepareFormData();
    try {
      if (operation === 'add') {
        await this.performAddContact(formData);
      } else {
        await this.performUpdateContact(formData);
      }
    } catch (error) {
      this.handleOperationError(operation, error);
    }
  }
  /**
   * Performs add contact operation.
   * 
   * @param contactData - Contact data to add
   */
  private async performAddContact(contactData: Partial<Contact>): Promise<void> {
    const newContact = await this.crudService.createContact(contactData, this.contacts);
    this.handleContactAdded(newContact);
  }
  /**
   * Performs update contact operation.
   * 
   * @param contactData - Contact data to update
   */
  private async performUpdateContact(contactData: Partial<Contact>): Promise<void> {
    if (!this.selectedContact?.id) {
      throw new Error('No contact ID for update');
    }
    const updatedContact = await this.crudService.updateContact(this.selectedContact.id, contactData);
    this.handleContactUpdated(updatedContact);
  }
  /**
   * Deletes the currently selected contact.
   */
  async deleteContact(): Promise<void> {
    if (!this.selectedContact?.id) return;
    this.stateService.suppressAnimations();
    try {
      await this.crudService.deleteContact(this.selectedContact.id);
      this.handleContactDeleted(this.selectedContact.id);
    } catch (error) {
      this.handleDeleteError(error);
    }
  }
  /**
   * Handles successful contact addition.
   * 
   * @param newContact - Newly created contact
   */
  private handleContactAdded(newContact: Contact): void {
    this.contacts = this.crudService.addContactToArray(this.contacts, newContact);
    this.groupContacts();
    this.closeAddContactOverlay();
    this.showSuccessMessage('Contact successfully created!');
    this.selectContact(newContact);
  }
  /**
   * Handles successful contact update.
   * 
   * @param updatedContact - Updated contact
   */
  private handleContactUpdated(updatedContact: Contact): void {
    if (this.selectedContact) {
      Object.assign(this.selectedContact, updatedContact);
      if (!this.displayService.isCurrentUserContact(this.selectedContact)) {
        this.contacts = this.crudService.updateContactInArray(this.contacts, this.selectedContact);
      }
      this.groupContacts();
    }
    this.closeEditContactOverlay();
    this.showSuccessMessage('Contact successfully updated!');
  }
  /**
   * Handles successful contact deletion.
   * 
   * @param contactId - ID of deleted contact
   */
  private handleContactDeleted(contactId: string): void {
    this.contacts = this.crudService.removeContactFromArray(this.contacts, contactId);
    this.groupContacts();
    this.showSuccessMessage('Contact successfully deleted!');
    this.clearSelectedContactAsync();
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
    setTimeout(() => {
      this.selectedContact = null;
      this.stateService.enableAnimations();
    }, 0);
  }
  // UI and Display Methods
  /**
   * Selects a contact and handles mobile view.
   * 
   * @param contact - Contact to select
   */
  selectContact(contact: Contact): void {
    this.selectedContact = contact;
    if (this.isMobileView) {
      this.stateService.showMobileSingleContactView();
    }
  }
  /**
   * Selects the current user and creates a contact-like object for display.
   */
  selectCurrentUser(): void {
    const currentUserContact = this.displayService.getCurrentUserAsContact();
    if (currentUserContact) {
      this.selectContact(currentUserContact);
    }
  }
  /**
   * Navigates back to contact list on mobile.
   */
  backToList(): void {
    this.stateService.backToContactList();
    this.selectedContact = null;
  }
  /**
   * Handles FAB button click based on current state.
   */
  handleFabClick(): void {
    const action = this.stateService.getFabAction();
    if (action === 'more') {
      this.openMoreMenu();
    } else {
      this.openAddContactOverlay();
    }
  }
  /**
   * Opens mobile more menu.
   */
  openMoreMenu(): void {
    this.stateService.openMobileMoreMenu();
  }
  /**
   * Closes mobile more menu.
   */
  closeMoreMenu(): void {
    this.stateService.closeMobileMoreMenu();
  }
  /**
   * Shows success message with automatic hiding.
   * 
   * @param message - Message to display
   */
  showSuccessMessage(message: string): void {
    this.stateService.showSuccessMessage(message);
    this.uiService.showSuccessMessage(message).then(() => {
      this.stateService.hideSuccessMessage();
    });
  }
  /**
   * Updates mobile view status and responsive state.
   */
  updateMobileViewStatus(): void {
    this.stateService.updateMobileViewStatus();
  }
  // Display Delegation Methods
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
  // Form Validation Methods
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
  // Static Methods for External Use
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
  // Lifecycle Methods
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
    this.contactsSubscription?.unsubscribe();
    this.resizeCleanup?.();
    this.stateService.cleanup();
    this.formService.cleanup();
    this.crudService.cleanup();
    this.displayService.cleanup();
  }
}

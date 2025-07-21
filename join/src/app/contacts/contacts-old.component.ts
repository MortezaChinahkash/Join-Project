import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { InlineSvgDirective } from '../inline-svg.directive';
import { Contact, ContactDataService } from './services/contact-data.service';
import { ContactOrganizationService } from './services/contact-organization.service';
import { ContactUiService } from './services/contact-ui.service';
import { AuthService, User } from '../shared/services/auth.service';
/**
 * Component for managing contacts with full CRUD operations.
 * Supports adding, editing, deleting, and viewing contacts.
 * Includes responsive design for mobile and desktop views.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, InlineSvgDirective],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
  animations: [
    trigger('slideInRight', [
      transition('* => suppress', []),
      transition('suppress => void', []),
      transition('* => *', [
        style({ transform: 'translateX(100%)', opacity: 0 }),

        animate(
          '350ms cubic-bezier(.35,0,.25,1)',
          style({ transform: 'translateX(0)', opacity: 1 })

        ),
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(.35,0,.25,1)',
          style({ transform: 'translateX(100%)', opacity: 0 })

        ),
      ]),
    ]),
  ],
})
export class ContactsComponent implements OnInit, OnDestroy {
  // UI State properties
  contactSuccessMessageOverlay: boolean = false;
  contactSuccessMessageText: string = 'Contact successfully created!';
  showAddContactOverlay: boolean = false;
  showEditContactOverlay: boolean = false;
  showMobileMoreMenu: boolean = false;
  isMobileView: boolean = false;
  showMobileSingleContact: boolean = false;
  suppressAnimation: boolean = false;
  // Data properties
  contacts: Contact[] = [];
  groupedContacts: { [key: string]: Contact[] } = {};
  selectedContact: Contact | null = null;
  addContactForm: FormGroup;
  // Subscriptions
  private contactsSubscription?: Subscription;
  private resizeListener?: () => void;
  /**
   * Initializes the contacts component with required services and form.
   *
   * @param fb - FormBuilder for reactive forms
   * @param dataService - Service for data operations
   * @param organizationService - Service for contact organization
   * @param uiService - Service for UI logic
   * @param authService - Service for authentication
   */
  constructor(
    private fb: FormBuilder,
    private dataService: ContactDataService,
    private organizationService: ContactOrganizationService,
    private uiService: ContactUiService,
    private authService: AuthService
  ) {
    this.addContactForm = this.createContactForm();
  }

  /**
   * Angular lifecycle hook - component initialization.
   */
  ngOnInit(): void {
    this.initializeComponent();
    this.loadContacts();
    this.setupResizeListener();
  }

  /**
   * Angular lifecycle hook - component cleanup.
   */
  ngOnDestroy(): void {
    this.cleanupSubscriptions();
    this.removeResizeListener();
  }

  /**
   * Creates the reactive form for contact management.
   * @returns Configured FormGroup
   */
  private createContactForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });
  }

  /**
   * Initializes component state and UI.
   */
  private initializeComponent(): void {
    this.updateMobileViewStatus();
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
   * @param contacts - Loaded contacts array
   */
  private handleContactsLoaded(contacts: Contact[]): void {
    this.contacts = contacts;
    this.groupContacts();
  }

  /**
   * Handles contact loading errors.
   * @param error - Error object
   */
  private handleLoadError(error: any): void {
    console.error('Error loading contacts:', error);
  }

  /**
   * Sets up window resize listener for responsive behavior.
   */
  private setupResizeListener(): void {
    this.resizeListener = this.updateMobileViewStatus.bind(this);
    window.addEventListener('resize', this.resizeListener);
  }

  /**
   * Removes window resize listener.
   */
  private removeResizeListener(): void {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  /**
   * Cleans up component subscriptions.
   */
  private cleanupSubscriptions(): void {
    this.contactsSubscription?.unsubscribe();
  }

  /**
   * Updates mobile view status and responsive state.
   */
  updateMobileViewStatus(): void {
    const state = this.uiService.updateResponsiveState(
      this.isMobileView, 
      this.showMobileSingleContact
    );
    this.isMobileView = state.isMobileView;
    this.showMobileSingleContact = state.showMobileSingleContact;
  }

  /**
   * Groups contacts by first letter of name.
   */
  groupContacts(): void {
    this.groupedContacts = this.organizationService.groupContactsByLetter(this.contacts);
  }

  /**
   * Opens the add contact overlay.
   */
  openAddContactOverlay(): void {
    this.showAddContactOverlay = true;
    this.addContactForm.reset();
  }

  /**
   * Closes the add contact overlay.
   */
  closeAddContactOverlay(): void {
    this.showAddContactOverlay = false;
  }

  /**
   * Handles add contact form submission.
   */
  onSubmitAddContact(): void {
    this.processContactForm('add');
  }

  /**
   * Handles update contact form submission.
   */
  onSubmitUpdateContact(): void {
    this.processContactForm('update');
  }

  /**
   * Processes contact form submission for add or update operations.
   * @param operation - Type of operation ('add' or 'update')
   */
  private processContactForm(operation: 'add' | 'update'): void {
    if (!this.validateForm()) return;
    const formData = this.prepareFormData();
    if (operation === 'add') {
      this.performAddContact(formData);
    } else {
      this.performUpdateContact(formData);
    }
  }

  /**
   * Validates the contact form.
   * @returns True if form is valid
   */
  private validateForm(): boolean {
    this.ensurePhoneValue();
    if (!this.addContactForm.valid) {
      this.addContactForm.markAllAsTouched();
      return false;
    }
    return true;
  }

  /**
   * Prepares form data for submission.
   * @returns Sanitized contact data
   */
  private prepareFormData(): Partial<Contact> {
    return this.uiService.sanitizeContactData(this.addContactForm.value);
  }

  /**
   * Performs add contact operation.
   * @param contactData - Contact data to add
   */
  private async performAddContact(contactData: Partial<Contact>): Promise<void> {
    if (!contactData.name || !contactData.email) {
      console.error('Missing required contact data');
      return;
    }
    try {
      const newContact = await this.dataService.addContactToFirestore({
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone
      });
      this.handleContactAdded(newContact);
    } catch (error) {

      this.handleOperationError('adding', error);
    }
  }

  /**
   * Performs update contact operation.
   * @param contactData - Contact data to update
   */
  private async performUpdateContact(contactData: Partial<Contact>): Promise<void> {
    if (!this.selectedContact?.id) {
      console.error('No contact ID for update');
      return;
    }
    try {
      // Check if this is the current user
      if (this.selectedContact.isCurrentUser) {
        await this.updateCurrentUserProfile(contactData);
      } else {
        await this.dataService.updateContactInFirestore(this.selectedContact.id, contactData);
      }
      this.handleContactUpdated(contactData);
    } catch (error) {

      this.handleOperationError('updating', error);
    }
  }

  /**
   * Updates the current user's profile in Firebase Auth.
   * @param contactData - Contact data to update
   */
  private async updateCurrentUserProfile(contactData: Partial<Contact>): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('No current user found');
    }
    // Update Firebase Auth profile if name changed
    if (contactData.name && contactData.name !== currentUser.name) {
      await this.authService.updateUserProfile(contactData.name);
    }
    // Note: Phone is not stored in Firebase Auth, only in the temporary contact object
    // This is fine since the current user contact is recreated each time
  }

  /**
   * Handles successful contact addition.
   * @param newContact - Newly created contact
   */
  private handleContactAdded(newContact: Contact): void {
    this.contacts = this.organizationService.addContactToArray(this.contacts, newContact);
    this.groupContacts();
    this.closeAddContactOverlay();
    this.showSuccessMessage('Contact successfully created!');
    this.selectContact(newContact);
  }

  /**
   * Handles successful contact update.
   * @param updatedData - Updated contact data
   */
  private handleContactUpdated(updatedData: Partial<Contact>): void {
    if (this.selectedContact) {
      if (this.selectedContact.isCurrentUser) {
        // For current user, update the temporary object and refresh the contact list
        Object.assign(this.selectedContact, updatedData);
        // Refresh the contacts list to get the updated current user at the top
        this.groupContacts();
      } else {
        // For regular contacts, update normally
        Object.assign(this.selectedContact, updatedData);
        this.contacts = this.organizationService.updateContactInArray(
          this.contacts, 
          this.selectedContact
        );
        this.groupContacts();
      }
    }
    this.closeEditContactOverlay();
    this.showSuccessMessage('Contact successfully updated!');
  }

  /**
   * Handles operation errors.
   * @param operation - Type of operation that failed
   * @param error - Error object
   */
  private handleOperationError(operation: string, error: any): void {
    console.error(`Error ${operation} contact:`, error);
  }

  /**
   * Ensures phone field has a value.
   */
  private ensurePhoneValue(): void {
    const phoneControl = this.addContactForm.get('phone');
    const phoneValue = phoneControl?.value;
    if (!phoneValue?.trim()) {
      phoneControl?.setValue('N/A');
      phoneControl?.updateValueAndValidity();
    }
  }

  /**
   * Opens edit contact overlay.
   * @param contact - Contact to edit
   */
  openEditContactOverlay(contact: Contact): void {
    this.showEditContactOverlay = true;
    this.selectedContact = contact;
    this.populateFormWithContact(contact);
  }

  /**
   * Populates form with contact data.
   * @param contact - Contact data to populate form with
   */
  private populateFormWithContact(contact: Contact): void {
    this.addContactForm.patchValue({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
    });
  }

  /**
   * Closes edit contact overlay.
   */
  closeEditContactOverlay(): void {
    this.showEditContactOverlay = false;
  }

  /**
   * Deletes the currently selected contact.
   */
  deleteContact(): void {
    if (!this.selectedContact?.id) return;
    this.suppressAnimation = true;
    this.performDeleteOperation(this.selectedContact.id);
  }

  /**
   * Performs contact deletion operation.
   * @param contactId - ID of contact to delete
   */
  private async performDeleteOperation(contactId: string): Promise<void> {
    try {
      await this.dataService.deleteContactFromFirestore(contactId);
      this.handleContactDeleted(contactId);
    } catch (error) {

      this.handleDeleteError(error);
    }
  }

  /**
   * Handles successful contact deletion.
   * @param contactId - ID of deleted contact
   */
  private handleContactDeleted(contactId: string): void {
    this.contacts = this.organizationService.removeContactFromArray(this.contacts, contactId);
    this.groupContacts();
    this.showSuccessMessage('Contact successfully deleted!');
    this.clearSelectedContactAsync();
  }

  /**
   * Handles contact deletion errors.
   * @param error - Error object
   */
  private handleDeleteError(error: any): void {
    console.error('Error deleting contact:', error);
    this.suppressAnimation = false;
  }

  /**
   * Clears selected contact asynchronously.
   */
  private clearSelectedContactAsync(): void {
    setTimeout(() => {
      this.selectedContact = null;
      this.suppressAnimation = false;
    }, 0);
  }

  /**
   * Selects a contact and handles mobile view.
   * @param contact - Contact to select
   */
  selectContact(contact: Contact): void {
    this.selectedContact = contact;
    if (this.isMobileView) {
      this.showMobileSingleContact = true;
    }
  }

  /**
   * Navigates back to contact list on mobile.
   */
  backToList(): void {
    this.showMobileSingleContact = false;
    this.selectedContact = null;
    this.closeMoreMenu();
  }

  /**
   * Handles FAB button click based on current state.
   */
  handleFabClick(): void {
    const action = this.uiService.getFabAction(this.isMobileView, this.showMobileSingleContact);
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
    this.showMobileMoreMenu = true;
  }

  /**
   * Closes mobile more menu.
   */
  closeMoreMenu(): void {
    this.showMobileMoreMenu = false;
  }

  /**
   * Shows success message with automatic hiding.
   * @param message - Message to display
   */
  showSuccessMessage(message: string): void {
    this.contactSuccessMessageText = message;
    this.contactSuccessMessageOverlay = true;
    this.uiService.showSuccessMessage(message).then(() => {
      this.contactSuccessMessageOverlay = false;
    });
  }

  /**
   * Gets contact initials for display.
   * @param name - Contact name
   * @returns Initials string
   */
  getInitials(name: string): string {
    return this.organizationService.getContactInitials(name);
  }

  /**
   * Gets contact color for avatar.
   * @param name - Contact name
   * @returns Hex color string
   */
  getInitialsColor(name: string): string {
    return this.organizationService.getContactColor(name);
  }

  /**
   * Truncates contact name if longer than 25 characters.
   * @param name - Contact name
   * @returns Truncated name with ellipsis or original name
   */
  getTruncatedName(name: string): string {
    if (name.length > 25) {
      return name.substring(0, 25) + '...';
    }
    return name;
  }

  /**
   * Checks if a contact name is considered long (>25 characters).
   * @param name - Contact name
   * @returns True if name is longer than 25 characters
   */
  isLongName(name: string): boolean {
    return name.length > 25;
  }

  /**
   * Truncates email if longer than 23 characters with ellipsis ending
   * @param email - Email to truncate
   * @returns Truncated email or original if short enough
   */
  truncateEmail(email: string): string {
    if (!email) return '';
    if (email.length <= 23) return email;
    return email.substring(0, 20) + '...';
  }

  /**
   * Gets the current logged-in user.
   * @returns Current user or null
   */
  getCurrentUser(): User | null {
    return this.authService.currentUser;
  }

  /**
   * Gets the display name for the current user.
   * @returns Display name or email
   */
  getCurrentUserDisplayName(): string {
    const user = this.getCurrentUser();
    return user?.name || user?.email || 'Unknown User';
  }

  /**
   * Selects the current user and creates a contact-like object for display.
   */
  selectCurrentUser(): void {
    const user = this.getCurrentUser();
    if (user) {
      // Create a temporary contact object for the current user
      const currentUserContact: Contact = {
        id: 'current-user',
        name: user.name || user.email || 'Current User',
        email: user.email || '',
        phone: '', // Phone will be empty for current user initially
        isCurrentUser: true
      };
      this.selectedContact = currentUserContact;
      if (this.isMobileView) {
        this.showMobileSingleContact = true;
      }
    }
  }

  /**
   * Static method for getting contact initials (for external use).
   * @param name - Contact name
   * @returns Contact initials
   */
  static getInitials(name: string): string {
    const service = new ContactOrganizationService();
    return service.getContactInitials(name);
  }

  /**
   * Static method for getting contact color (for external use).
   * @param name - Contact name
   * @returns Hex color string
   */
  static getInitialsColor(name: string): string {
    const service = new ContactOrganizationService();
    return service.getContactColor(name);
  }
}

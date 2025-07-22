import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { InlineSvgDirective } from '../inline-svg.directive';
import { Contact } from './services/contact-data.service';
import { ContactsService } from './services/contacts.service';
/**
 * Refactored component for managing contacts with full CRUD operations.
 * Uses specialized services for better separation of concerns and maintainability.
 * Supports adding, editing, deleting, and viewing contacts with responsive design.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 2.0.0 - Refactored with specialized services
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
        /** Initial state for slide animation */
        style({ transform: 'translateX(100%)', opacity: 0 }),
        /** Animation to slide element into view */
        animate(
          '350ms cubic-bezier(.35,0,.25,1)',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        /** Animation to slide element out of view */
        animate(
          '200ms cubic-bezier(.35,0,.25,1)',
          style({ transform: 'translateX(100%)', opacity: 0 })
        ),
      ]),
    ]),
  ],
})
export class ContactsComponent implements OnInit, OnDestroy {
  showAddContactOverlay$!: any;
  showEditContactOverlay$!: any;
  showMobileMoreMenu$!: any;
  contactSuccessMessageOverlay$!: any;
  isMobileView$!: any;
  showMobileSingleContact$!: any;
  suppressAnimation$!: any;
  contactSuccessMessageText$!: any;
  private subscriptions: Subscription[] = [];
  /**
   * Initializes the contacts component with the main contacts service.
   * 
   * @param contactsService - Main contacts orchestrator service
   */
  constructor(private contactsService: ContactsService) {
    this.initializeObservables();
  }

  /**
   * Initializes service observables for template binding.
   */
  private initializeObservables(): void {
    this.showAddContactOverlay$ = this.contactsService.showAddContactOverlay$;
    this.showEditContactOverlay$ = this.contactsService.showEditContactOverlay$;
    this.showMobileMoreMenu$ = this.contactsService.showMobileMoreMenu$;
    this.contactSuccessMessageOverlay$ = this.contactsService.contactSuccessMessageOverlay$;
    this.isMobileView$ = this.contactsService.isMobileView$;
    this.showMobileSingleContact$ = this.contactsService.showMobileSingleContact$;
    this.suppressAnimation$ = this.contactsService.suppressAnimation$;
    this.contactSuccessMessageText$ = this.contactsService.contactSuccessMessageText$;
  }

  /**
   * Angular lifecycle hook - component initialization.
   */
  ngOnInit(): void {
    this.contactsService.initialize();
  }

  /**
   * Angular lifecycle hook - component cleanup.
   */
  ngOnDestroy(): void {
    this.contactsService.cleanup();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /** Gets all contacts array */
  get contacts(): Contact[] { return this.contactsService.allContacts; }

  /** Gets contacts grouped by first letter */
  get groupedContacts(): { [key: string]: Contact[] } { return this.contactsService.contactGroups; }

  /** Gets currently selected contact */
  get selectedContact(): Contact | null { return this.contactsService.currentContact; }

  /** Gets add contact form */
  get addContactForm(): FormGroup { return this.contactsService.getContactForm(); }

  /** Gets add contact overlay visibility */
  get showAddContactOverlay(): boolean { return this.contactsService.showAddContactOverlay; }

  /** Gets edit contact overlay visibility */
  get showEditContactOverlay(): boolean { return this.contactsService.showEditContactOverlay; }

  /** Gets mobile more menu visibility */
  get showMobileMoreMenu(): boolean { return this.contactsService.showMobileMoreMenu; }

  /** Gets contact success message overlay visibility */
  get contactSuccessMessageOverlay(): boolean { return this.contactsService.contactSuccessMessageOverlay; }

  /** Gets mobile view state */
  get isMobileView(): boolean { return this.contactsService.isMobileView; }

  /** Gets mobile single contact view state */
  get showMobileSingleContact(): boolean { return this.contactsService.showMobileSingleContact; }

  /** Gets animation suppression state */
  get suppressAnimation(): boolean { return this.contactsService.suppressAnimation; }

  /** Gets contact success message text */
  get contactSuccessMessageText(): string { return this.contactsService.contactSuccessMessageText; }

  /**
   * Opens the add contact overlay.
   */
  openAddContactOverlay(): void {
    this.contactsService.openAddContactOverlay();
  }

  /**
   * Closes the add contact overlay.
   */
  closeAddContactOverlay(): void {
    this.contactsService.closeAddContactOverlay();
  }

  /**
   * Opens edit contact overlay.
   * 
   * @param contact - Contact to edit
   */
  openEditContactOverlay(contact: Contact): void {
    this.contactsService.openEditContactOverlay(contact);
  }

  /**
   * Closes edit contact overlay.
   */
  closeEditContactOverlay(): void {
    this.contactsService.closeEditContactOverlay();
  }

  /**
   * Handles add contact form submission.
   */
  onSubmitAddContact(): void {
    this.contactsService.onSubmitAddContact();
  }

  /**
   * Handles update contact form submission.
   */
  onSubmitUpdateContact(): void {
    this.contactsService.onSubmitUpdateContact();
  }

  /**
   * Deletes the currently selected contact.
   */
  deleteContact(): void {
    this.contactsService.deleteContact();
  }

  /**
   * Selects a contact and handles mobile view.
   * 
   * @param contact - Contact to select
   */
  selectContact(contact: Contact): void {
    this.contactsService.selectContact(contact);
  }

  /**
   * Selects the current user and creates a contact-like object for display.
   */
  selectCurrentUser(): void {
    this.contactsService.selectCurrentUser();
  }

  /**
   * Navigates back to contact list on mobile.
   */
  backToList(): void {
    this.contactsService.backToList();
  }

  /**
   * Handles FAB button click based on current state.
   */
  handleFabClick(): void {
    this.contactsService.handleFabClick();
  }

  /**
   * Opens mobile more menu.
   */
  openMoreMenu(): void {
    this.contactsService.openMoreMenu();
  }

  /**
   * Closes mobile more menu.
   */
  closeMoreMenu(): void {
    this.contactsService.closeMoreMenu();
  }

  /**
   * Updates mobile view status and responsive state.
   */
  updateMobileViewStatus(): void {
    this.contactsService.updateMobileViewStatus();
  }

  /**
   * Gets contact initials for display.
   * 
   * @param name - Contact name
   * @returns Initials string
   */
  getInitials(name: string): string {
    return this.contactsService.getInitials(name);
  }

  /**
   * Gets contact color for avatar.
   * 
   * @param name - Contact name
   * @returns Hex color string
   */
  getInitialsColor(name: string): string {
    return this.contactsService.getInitialsColor(name);
  }

  /**
   * Truncates contact name if longer than 25 characters.
   * 
   * @param name - Contact name
   * @returns Truncated name with ellipsis or original name
   */
  getTruncatedName(name: string): string {
    return this.contactsService.getTruncatedName(name);
  }

  /**
   * Checks if a contact name is considered long (>25 characters).
   * 
   * @param name - Contact name
   * @returns True if name is longer than 25 characters
   */
  isLongName(name: string): boolean {
    return this.contactsService.isLongName(name);
  }

  /**
   * Truncates email if longer than 23 characters with ellipsis ending.
   * 
   * @param email - Email to truncate
   * @returns Truncated email or original if short enough
   */
  truncateEmail(email: string): string {
    return this.contactsService.truncateEmail(email);
  }

  /**
   * Gets the current logged-in user.
   * 
   * @returns Current user or null
   */
  getCurrentUser() {
    return this.contactsService.getCurrentUser();
  }

  /**
   * Gets the display name for the current user.
   * 
   * @returns Display name or email
   */
  getCurrentUserDisplayName(): string {
    return this.contactsService.getCurrentUserDisplayName();
  }

  /**
   * Checks if a specific field has errors.
   * 
   * @param fieldName - Name of the field to check
   * @returns True if field has errors and is touched
   */
  hasFieldError(fieldName: string): boolean {
    return this.contactsService.hasFieldError(fieldName);
  }

  /**
   * Gets error message for a specific field.
   * 
   * @param fieldName - Name of the field
   * @returns Error message or empty string
   */
  getFieldError(fieldName: string): string {
    return this.contactsService.getFieldError(fieldName);
  }

  /**
   * Static method for getting contact initials (for external use).
   * 
   * @param name - Contact name
   * @returns Contact initials
   */
  static getInitials(name: string): string {
    return ContactsService.getInitials(name);
  }

  /**
   * Static method for getting contact color (for external use).
   * 
   * @param name - Contact name
   * @returns Hex color string
   */
  static getInitialsColor(name: string): string {
    return ContactsService.getInitialsColor(name);
  }
}

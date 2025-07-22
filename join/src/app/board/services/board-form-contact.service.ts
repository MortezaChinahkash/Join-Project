import { Injectable } from '@angular/core';
import { BoardFormContactSelectionService } from './board-form-contact-selection.service';
import { BoardFormOverlayService } from './board-form-overlay-v2.service';
import { Contact } from '../../contacts/services/contact-data.service';
import { Task } from '../../interfaces/task.interface';

/**
 * Service for managing contact-related functionality in board forms.
 * Handles contact selection, display, and dropdown operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardFormContactService {

  constructor(
    private contactSelectionService: BoardFormContactSelectionService,
    private overlayService: BoardFormOverlayService
  ) {}

  /** Gets currently selected contacts */
  get selectedContacts(): Contact[] {
    return this.contactSelectionService.selectedContacts;
  }

  /**
   * Checks if contact is selected.
   * 
   * @param contact - Contact to check
   * @returns True if contact is selected
   */
  isContactSelected(contact: Contact): boolean {
    return this.contactSelectionService.isContactSelected(contact);
  }

  /**
   * Gets selected contacts text.
   * 
   * @returns Selected contacts text
   */
  getSelectedContactsText(): string {
    return this.contactSelectionService.getSelectedContactsText();
  }

  /**
   * Toggles contactselection state.
   * @param contact - Contact parameter
   * @param event? - Event? parameter
   */
  toggleContactSelection(contact: Contact, event?: Event): void {
    this.contactSelectionService.toggleContact(contact);
  }

  /**
   * Sets selectedcontactsbynames value.
   * @param contactNames - Contactnames parameter
   * @param allContacts - Allcontacts parameter
   */
  setSelectedContactsByNames(contactNames: string[], allContacts: Contact[]): void {
    this.contactSelectionService.setSelectedContactsByNames(contactNames, allContacts);
  }

  /** Gets dropdown open state */
  get isDropdownOpen(): boolean {
    return this.contactSelectionService.isDropdownOpen;
  }

  /** Sets dropdown open state */
  set isDropdownOpen(value: boolean) {
    this.contactSelectionService.isDropdownOpen = value;
  }

  /**
   * Toggles dropdown state.
   */
  toggleDropdown(): void {
    this.contactSelectionService.toggleDropdown();
  }

  /** Gets assigned contacts dropdown visibility state */
  get showAssignedContactsDropdown(): boolean {
    return this.contactSelectionService.showAssignedContactsDropdown;
  }

  /** Sets assigned contacts dropdown visibility state */
  set showAssignedContactsDropdown(value: boolean) {
    this.contactSelectionService.showAssignedContactsDropdown = value;
  }

  /**
   * Toggles assignedcontactsdropdown state.
   */
  toggleAssignedContactsDropdown(): void {
    this.contactSelectionService.toggleAssignedContactsDropdown();
  }

  /**
   * Gets remaining assigned contacts count.
   * 
   * @returns Number of remaining contacts
   */
  getRemainingAssignedContactsCount(): number {
    const task = this.overlayService.selectedTask;
    if (!task || !task.assignedTo || task.assignedTo.length <= 4) return 0;
    return task.assignedTo.length - 4;
  }

  /**
   * Gets remaining assigned contacts.
   * 
   * @returns Array of remaining contact names
   */
  getRemainingAssignedContacts(): string[] {
    const task = this.overlayService.selectedTask;
    if (!task || !task.assignedTo || task.assignedTo.length <= 4) return [];
    return task.assignedTo.slice(4);
  }

  /**
   * Gets displayed assigned contacts.
   * 
   * @returns Array of displayed contacts
   */
  getDisplayedAssignedContacts(): string[] {
    const task = this.overlayService.selectedTask;
    if (!task || !task.assignedTo) return [];
    return task.assignedTo.slice(0, 4);
  }

  /**
   * Checks if there are more assigned contacts.
   * 
   * @returns True if more contacts exist
   */
  hasMoreAssignedContacts(): boolean {
    const task = this.overlayService.selectedTask;
    return !!(task && task.assignedTo && task.assignedTo.length > 4);
  }

  /**
   * Toggles contact selection.
   * 
   * @param contact - Contact to toggle
   */
  toggleContact(contact: Contact): void {
    this.contactSelectionService.toggleContact(contact);
  }

  /**
   * Gets selected contacts.
   * 
   * @returns Array of selected contacts
   */
  getSelectedContacts(): Contact[] {
    return this.contactSelectionService.selectedContacts;
  }

  /**
   * Opens contact dropdown.
   */
  openContactDropdown(): void {
    this.contactSelectionService.openDropdown();
  }

  /**
   * Closes contact dropdown.
   */
  closeContactDropdown(): void {
    this.contactSelectionService.closeDropdown();
  }

  /**
   * Checks if contact dropdown is open.
   * 
   * @returns True if dropdown is open
   */
  isContactDropdownOpen(): boolean {
    return this.contactSelectionService.isDropdownOpen;
  }

  /**
   * Cleanup method for destroying the service.
   */
  cleanup(): void {
    this.contactSelectionService.cleanup();
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Contact } from './contact-data.service';
import { ContactsStateService } from './contacts-state.service';

/**
 * Service providing proxy access to state properties and observables.
 * Centralizes access to state getters and provides clean interface for components.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class ContactStateProxyService {

  constructor(
    private stateService: ContactsStateService
  ) {}

  // Observable getters for reactive state access
  
  /** Observable for add contact overlay visibility */
  get showAddContactOverlay$(): Observable<boolean> { 
    return this.stateService.showAddContactOverlay$; 
  }

  /** Observable for edit contact overlay visibility */
  get showEditContactOverlay$(): Observable<boolean> { 
    return this.stateService.showEditContactOverlay$; 
  }

  /** Observable for mobile more menu visibility */
  get showMobileMoreMenu$(): Observable<boolean> { 
    return this.stateService.showMobileMoreMenu$; 
  }

  /** Observable for contact success message overlay visibility */
  get contactSuccessMessageOverlay$(): Observable<boolean> { 
    return this.stateService.contactSuccessMessageOverlay$; 
  }

  /** Observable for mobile view state */
  get isMobileView$(): Observable<boolean> { 
    return this.stateService.isMobileView$; 
  }

  /** Observable for mobile single contact view state */
  get showMobileSingleContact$(): Observable<boolean> { 
    return this.stateService.showMobileSingleContact$; 
  }

  /** Observable for animation suppression state */
  get suppressAnimation$(): Observable<boolean> { 
    return this.stateService.suppressAnimation$; 
  }

  /** Observable for contact success message text */
  get contactSuccessMessageText$(): Observable<string> { 
    return this.stateService.contactSuccessMessageText$; 
  }

  // Current state getters for immediate access

  /** Current add contact overlay visibility state */
  get showAddContactOverlay(): boolean { 
    return this.stateService.showAddContactOverlay; 
  }

  /** Current edit contact overlay visibility state */
  get showEditContactOverlay(): boolean { 
    return this.stateService.showEditContactOverlay; 
  }

  /** Current mobile more menu visibility state */
  get showMobileMoreMenu(): boolean { 
    return this.stateService.showMobileMoreMenu; 
  }

  /** Current contact success message overlay visibility state */
  get contactSuccessMessageOverlay(): boolean { 
    return this.stateService.contactSuccessMessageOverlay; 
  }

  /** Current mobile view state */
  get isMobileView(): boolean { 
    return this.stateService.isMobileView; 
  }

  /** Current mobile single contact view state */
  get showMobileSingleContact(): boolean { 
    return this.stateService.showMobileSingleContact; 
  }

  /** Current animation suppression state */
  get suppressAnimation(): boolean { 
    return this.stateService.suppressAnimation; 
  }

  /** Current contact success message text */
  get contactSuccessMessageText(): string { 
    return this.stateService.contactSuccessMessageText; 
  }

  // Data access methods

  /**
   * Gets all contacts array.
   * 
   * @param contacts - Current contacts array
   * @returns All contacts
   */
  getAllContacts(contacts: Contact[]): Contact[] { 
    return contacts; 
  }

  /**
   * Gets grouped contacts by first letter.
   * 
   * @param groupedContacts - Current grouped contacts
   * @returns Grouped contacts
   */
  getContactGroups(groupedContacts: { [key: string]: Contact[] }): { [key: string]: Contact[] } { 
    return groupedContacts; 
  }

  /**
   * Gets currently selected contact.
   * 
   * @param selectedContact - Current selected contact
   * @returns Selected contact or null
   */
  getCurrentContact(selectedContact: Contact | null): Contact | null { 
    return selectedContact; 
  }
}

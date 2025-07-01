import { Injectable, inject } from '@angular/core';
import { Firestore, collectionData, collection, addDoc, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Contact {
  /** Unique identifier for the contact */
  id?: string;
  /** Contact's full name */
  name: string;
  /** Contact's email address */
  email: string;
  /** Contact's phone number (optional) */
  phone?: string;
}

/**
 * Service for managing contact data operations with Firestore.
 * Handles CRUD operations for contacts including add, update, delete, and fetch.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ContactDataService {
  private firestore = inject(Firestore);

  /**
   * Loads all contacts from Firestore.
   * @returns Observable stream of contacts
   */
  loadContactsFromFirestore(): Observable<Contact[]> {
    const contactsCollection = collection(this.firestore, 'contacts');
    return collectionData(contactsCollection, { idField: 'id' }) as Observable<Contact[]>;
  }

  /**
   * Adds a new contact to Firestore.
   * @param contactData - Contact data to add
   * @returns Promise resolving to the created contact with ID
   */
  async addContactToFirestore(contactData: {
    name: string;
    email: string;
    phone?: string;
  }): Promise<Contact> {
    const docRef = await addDoc(collection(this.firestore, 'contacts'), {
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
    });
    
    return {
      id: docRef.id,
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
    };
  }

  /**
   * Updates an existing contact in Firestore.
   * @param contactId - ID of the contact to update
   * @param contactData - Updated contact data
   * @returns Promise for the update operation
   */
  async updateContactInFirestore(
    contactId: string,
    contactData: Partial<Contact>
  ): Promise<void> {
    return updateDoc(doc(this.firestore, 'contacts', contactId), {
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
    });
  }

  /**
   * Deletes a contact from Firestore.
   * @param contactId - ID of the contact to delete
   * @returns Promise for the delete operation
   */
  async deleteContactFromFirestore(contactId: string): Promise<void> {
    return deleteDoc(doc(this.firestore, 'contacts', contactId));
  }

  /**
   * Validates contact data before saving.
   * @param contactData - Contact data to validate
   * @returns True if valid, false otherwise
   */
  validateContactData(contactData: Partial<Contact>): boolean {
    return !!(contactData.name?.trim() && contactData.email?.trim());
  }

  /**
   * Ensures phone field has a value, defaults to "N/A" if empty.
   * @param phone - Phone value to check
   * @returns Processed phone value
   */
  processPhoneValue(phone: string | undefined): string {
    return phone?.trim() || 'N/A';
  }
}

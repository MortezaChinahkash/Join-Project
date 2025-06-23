import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collectionData, collection, addDoc, doc } from '@angular/fire/firestore';
import{ trigger, transition, style, animate} from '@angular/animations';
import { deleteDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface Contact {
  id?: string; 
  name: string;
  email: string;
  phone?: string;
}

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
  animations: [
  trigger('slideInRight', [
    transition('* => suppress', []), // Keine Enter-Animation wenn suppress
    transition('suppress => void', []), // Keine Leave-Animation wenn suppress
    transition('* => *', [
      style({ transform: 'translateX(100%)', opacity: 0 }),
      animate('350ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(0)', opacity: 1 }))
    ]),
    transition(':leave', [
      animate('200ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(100%)', opacity: 0 }))
    ])
  ])
]
})
export class ContactsComponent implements OnInit {
  contactSuccessMessageOverlay: boolean = false;
  contactSuccessMessageText: string = 'Contact successfully created!';
  contacts: Contact[] = [];
  groupedContacts: { [key: string]: Contact[] } = {};

  selectedContact: Contact | null = null;
  suppressAnimation = false;

  private firestore = inject(Firestore);


  showAddContactOverlay: boolean = false;
  showEditContactOverlay: boolean = false;
  addContactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.addContactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });
  }

  openAddContactOverlay() {
    this.showAddContactOverlay = true;
    this.addContactForm.reset();
  }

  closeAddContactOverlay() {
    this.showAddContactOverlay = false;
  }

  onSubmitAddContact() {
  // Prüfe auf leeren String, null oder undefined
  const phoneValue = this.addContactForm.get('phone')?.value;
  if (!phoneValue || phoneValue.trim() === "") {
    this.addContactForm.get('phone')?.setValue("N/A");
    this.addContactForm.get('phone')?.updateValueAndValidity();
  }
  if (this.addContactForm.valid) {
    addDoc(collection(this.firestore, 'contacts'), {
      name: this.addContactForm.value.name,
      email: this.addContactForm.value.email,
      phone: this.addContactForm.value.phone
    }).then((docRef) => {
      const newContact: Contact = {
        id: docRef.id,
        name: this.addContactForm.value.name,
        email: this.addContactForm.value.email,
        phone: this.addContactForm.value.phone
      };
      this.contacts.push(newContact);
      this.groupContacts();
      this.closeAddContactOverlay();
      this.showSuccessMessage('Contact successfully created!');
      this.selectContact(newContact);
    }).catch(error => {
      console.error('Error adding contact: ', error);
    });
  } else {
    this.addContactForm.markAllAsTouched();
  }
}

  onSubmitUpdateContact() {
  const phoneValue = this.addContactForm.get('phone')?.value;
  if (!phoneValue || phoneValue.trim() === "") {
    this.addContactForm.get('phone')?.setValue("N/A");
    this.addContactForm.get('phone')?.updateValueAndValidity();
  }
    if (this.addContactForm.valid && this.selectedContact && this.selectedContact.id) {
      updateDoc(doc(this.firestore, 'contacts', this.selectedContact.id), {
        name: this.addContactForm.value.name,
        email: this.addContactForm.value.email,
        phone: this.addContactForm.value.phone
      }).then(() => {
        Object.assign(this.selectedContact!, this.addContactForm.value);
      }).catch(error => {
        console.error('Error updating contact: ', error);
      });

      this.closeEditContactOverlay();
      this.showSuccessMessage('Contact successfully updated!');
    } else {
      this.addContactForm.markAllAsTouched();
      if (!this.selectedContact?.id) {
        console.error('No contact id for update!');
      }
    }
  }
  closeEditContactOverlay() {
    this.showEditContactOverlay = false;
  }
  openEditContactOverlay(contact: Contact) {
    this.showEditContactOverlay = true;
    this.selectedContact = contact;
    this.addContactForm.patchValue({
      name: contact.name,
      email: contact.email,
      phone: contact.phone
    });
  }

  deleteContact() {
  this.suppressAnimation = true;
  if (this.selectedContact && this.selectedContact.id) {
    const contactId = this.selectedContact.id;
    deleteDoc(doc(this.firestore, 'contacts', contactId)).then(() => {
      this.contacts = this.contacts.filter(c => c.id !== contactId);
      this.groupContacts();
      this.showSuccessMessage('Contact successfully deleted!');
      // Jetzt selectedContact asynchron entfernen
      setTimeout(() => {
        this.selectedContact = null;
        this.suppressAnimation = false;
      }, 0);
    }).catch(error => {
      console.error('Error deleting contact: ', error);
      this.suppressAnimation = false;
    });
  }
}

  ngOnInit() {
  const contactsCollection = collection(this.firestore, 'contacts');
    collectionData(contactsCollection, { idField: 'id' }) 
      .subscribe((contacts) => {
        // Typumwandlung auf Contact[]
        this.contacts = contacts as Contact[];
        this.groupContacts();
      });
  }

groupContacts() {
  this.groupedContacts = {};
  for (const contact of this.contacts) {
    if (!contact.name) continue;
    const firstLetter = contact.name.trim()[0].toUpperCase();
    if (!this.groupedContacts[firstLetter]) {
      this.groupedContacts[firstLetter] = [];
    }
    this.groupedContacts[firstLetter].push(contact);
  }
}

getInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

getInitialsColor(name: string): string {
  if (!name) return '#888';
  const colors = [
    '#FFB900', '#D83B01', '#B50E0E', '#E81123', '#B4009E', '#5C2D91',
    '#0078D7', '#00B4FF', '#008272', '#107C10', '#7FBA00', '#F7630C',
    '#CA5010', '#EF6950', '#E74856', '#0099BC', '#7A7574', '#767676',
    '#FF8C00', '#E3008C', '#68217A', '#00188F', '#00BCF2', '#00B294',
    '#BAD80A', '#FFF100'
  ];
  // Erster Buchstabe als Index (A=0, B=1, ...)
  const letter = name.trim()[0].toUpperCase();
  const index = letter.charCodeAt(0) - 65;
  return colors[index % colors.length];
} 

selectContact(contact: Contact) {
  this.selectedContact = contact;
}
showSuccessMessage(message: string){
  this.contactSuccessMessageText = message;
  this.contactSuccessMessageOverlay = true;
  setTimeout(() => {
    this.contactSuccessMessageOverlay = false;
  }, 3000); // Nachricht nach 3 Sekunden ausblenden
}
}

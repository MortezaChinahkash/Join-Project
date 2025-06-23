import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import{ trigger, transition, style, animate} from '@angular/animations';

export interface Contact {
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

  contacts: Contact[] = [];
  groupedContacts: { [key: string]: Contact[] } = {};

  selectedContact: Contact | null = null;

  private firestore = inject(Firestore);


  showAddContactOverlay = false;
  showEditContactOverlay = false;
  addContactForm: FormGroup;
  // editContactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.addContactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required]
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
    if (this.addContactForm.valid) {
      // Handle form submission logic here
      this.closeAddContactOverlay();
    } else {
      this.addContactForm.markAllAsTouched();
    }
  }
  onSubmitUpdateContact() {
    if (this.addContactForm.valid) {
      // Handle form submission logic here
      this.closeEditContactOverlay();
    } else {
      this.addContactForm.markAllAsTouched();
    }
  }
  closeEditContactOverlay() {
    this.showEditContactOverlay = false;
  }
  openEditContactOverlay(contact: Contact) {
    this.showEditContactOverlay = true;
    this.selectedContact = contact;
    // Patch the form with the selected contact's data
    this.addContactForm.patchValue({
      name: contact.name,
      email: contact.email,
      phone: contact.phone
    });
  }

  deleteContact() {
    // Logic to delete a contact
  }

  ngOnInit() {
  const contactsCollection = collection(this.firestore, 'contacts');
    collectionData(contactsCollection) // gibt Observable<any[]>
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
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
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

}

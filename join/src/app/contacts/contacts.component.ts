import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent {

  contacts = [
  { name: 'Anton Mayer',        email: 'anton.mayer@gmail.com',        phone: '+49 151 23456789' },
  { name: 'Alfons Gärtner',      email: 'alfons.gaertner@gmail.com',  phone: '+49 151 9996661' },
  { name: 'Benedikt Ziegler',   email: 'benedikt.ziegler@yahoo.de',    phone: '+49 176 98765432' },
  { name: 'Clara Schmidt',      email: 'clara.schmidt@web.de',         phone: '+49 172 11223344' },
  { name: 'David Eisenberg',    email: 'david.eisenberg@gmail.com',    phone: '+49 160 99887766' },
  { name: 'Eva Fischer',        email: 'eva.fischer@outlook.com',      phone: '+49 151 44332211' },
  { name: 'Felix Hoffmann',     email: 'felix.hoffmann@gmx.de',        phone: '+49 157 66554433' },
  { name: 'Gina Bauer',         email: 'gina.bauer@gmail.com',         phone: '+49 163 55667788' },
  { name: 'Hannah Weber',       email: 'hannah.weber@t-online.de',     phone: '+49 152 33445566' },
  { name: 'Isabel König',       email: 'isabel.koenig@web.de',         phone: '+49 175 22334455' },
  { name: 'Jonas Richter',      email: 'jonas.richter@gmail.com',      phone: '+49 159 77889900' },
  { name: 'Katrin Arnold',      email: 'katrin.arnold@web.de',         phone: '+49 151 11223344' },
  { name: 'Lukas Brandt',       email: 'lukas.brandt@gmail.com',       phone: '+49 176 22334455' },
  { name: 'Maria Neumann',      email: 'maria.neumann@outlook.com',    phone: '+49 172 33445566' },
  { name: 'Nico Schröder',      email: 'nico.schroeder@gmx.de',        phone: '+49 160 44556677' },
  { name: 'Oliver Wagner',      email: 'oliver.wagner@gmail.com',      phone: '+49 151 55667788' },
  { name: 'Paulina Becker',     email: 'paulina.becker@web.de',        phone: '+49 157 66778899' },
  { name: 'Ralf Zimmermann',    email: 'ralf.zimmermann@t-online.de',  phone: '+49 163 77889900' },
  { name: 'Sophie Klein',       email: 'sophie.klein@gmail.com',       phone: '+49 152 88990011' },
  { name: 'Thomas Wolf',        email: 'thomas.wolf@outlook.com',      phone: '+49 175 99001122' },
  { name: 'Ute Frank',          email: 'ute.frank@web.de',             phone: '+49 159 10111213' },
  { name: 'Viktor Lehmann',     email: 'viktor.lehmann@gmail.com',     phone: '+49 151 12131415' },
  { name: 'Wilma Hartmann',     email: 'wilma.hartmann@gmx.de',        phone: '+49 176 13141516' }
];

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

  groupedContacts: { [key: string]: any[] } = {};


  showAddContactOverlay = false;
  addContactForm: FormGroup;

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

  editContact() {
    // Logic to edit a contact
  }
  deleteContact() {
    // Logic to delete a contact
  }

  ngOnInit() {
  this.groupContacts();
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

}

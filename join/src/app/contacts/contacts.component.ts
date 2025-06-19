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
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-contacts',
  imports: [CommonModule],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss'
})
export class ContactsComponent {
  showAddContactOverlay = false;

  openAddContactOverlay() {
    this.showAddContactOverlay = true;
  }

  closeAddContactOverlay() {
    this.showAddContactOverlay = false;
  }

  onSubmitAddContact(event: Event) {
    event.preventDefault();
    this.closeAddContactOverlay();
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { NavComponent } from "../nav/nav.component";
import { HeaderComponent } from '../header/header.component';
import { ContactsComponent } from '../contacts/contacts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavComponent, ContactsComponent],
  templateUrl: './main-content.component.html',
  styleUrl: '../app.component.scss'
})
export class MainContentComponent {
  title = 'Portfolio';
}
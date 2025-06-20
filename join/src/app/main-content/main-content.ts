import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { NavComponent } from "../nav/nav.component";
import { HeaderComponent } from '../header/header.component';
import { ContactsComponent } from '../contacts/contacts.component';

import { HelpComponent } from '../help/help.component';
import { LegalNoticeComponent } from '../legal-notice/legal-notice.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavComponent, HeaderComponent, ContactsComponent, HelpComponent, LegalNoticeComponent],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {
  title = 'Portfolio';
}
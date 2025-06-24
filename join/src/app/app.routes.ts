import { NgModule } from '@angular/core';
import { RouterModule} from '@angular/router';
import { Routes } from '@angular/router';
import { MainContentComponent } from './main-content/main-content';
import { SummaryComponent } from './summary/summary.component';
import { ContactsComponent } from './contacts/contacts.component';

export const routes: Routes = [

    {
    path: '',
    component: MainContentComponent,
    children: [
      { path: '', component: SummaryComponent },
      { path: 'contacts', component: ContactsComponent }
    ]
  }

];

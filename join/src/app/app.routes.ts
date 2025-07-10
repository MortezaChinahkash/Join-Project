import { NgModule } from '@angular/core';
import { RouterModule} from '@angular/router';
import { Routes } from '@angular/router';
import { MainContentComponent } from './main-content/main-content';
import { SummaryComponent } from './summary/summary.component';
import { ContactsComponent } from './contacts/contacts.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { BoardComponent } from './board/board.component';
import { AddTaskComponent } from './add-task/add-task.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Auth route - accessible without authentication
  { path: 'auth', component: AuthComponent },

  // Protected routes - require authentication
  {
    path: '',
    component: MainContentComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: SummaryComponent },
      { path: 'contacts', component: ContactsComponent },
      { path: 'summary', component: SummaryComponent },
      { path: 'add-task', component: AddTaskComponent },
      { path: 'imprint', component: LegalNoticeComponent },
      { path: 'privacy', component: PrivacyPolicyComponent },
      { path: 'board', component: BoardComponent },
    ]
  },

  // Redirect to auth if no route matches
  { path: '**', redirectTo: '/auth' }
];

import { Component } from '@angular/core';
import { FooterComponent } from "../footer/footer.component";
import { RouterModule } from '@angular/router';

/**
 * Navigation component that provides the main sidebar navigation
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [FooterComponent, RouterModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {

}

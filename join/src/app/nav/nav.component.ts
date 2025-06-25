import { Component } from '@angular/core';
import { FooterComponent } from "../footer/footer.component";
import { RouterModule } from '@angular/router';

import { InlineSvgDirective } from '../inline-svg.directive';

/**
 * Navigation component that provides the main sidebar navigation
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [FooterComponent, RouterModule, InlineSvgDirective],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {

}

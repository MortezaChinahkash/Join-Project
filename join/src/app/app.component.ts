import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root application component that serves as the entry point for the Angular application
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  /** The application title */
  title = 'join';
}

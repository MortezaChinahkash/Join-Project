import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
/**
 * Root application component that serves as the entry point for the Angular application.
 * Handles the main application layout and routing configuration.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  /** The application title used throughout the app */
  title = 'join';
  /**
   * Gets the current application title.
   * @returns The application title string
   */
  getTitle(): string {
    return this.title;
  }

  /**
   * Sets the application title.
   * @param newTitle - New title to set
   */
  setTitle(newTitle: string): void {
    this.title = newTitle;
  }
}

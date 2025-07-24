import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsoleProtectionService } from './shared/console-protection.service';
import { environment } from '../environments/environment';
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
export class AppComponent implements OnInit {
  /** The application title used throughout the app */
  title = 'join';

  constructor(private consoleProtection: ConsoleProtectionService) {}

  ngOnInit(): void {
    // Aktiviere Console-Schutz sowohl in Development als auch Production
    if (environment.security.enableConsoleProtection) {
      this.consoleProtection.initializeProtection();
      
      // Zeige Info in Development
      if (!environment.production) {
        console.log('%c🧪 Development: Console-Protection zum Testen aktiviert', 'color: blue; font-size: 14px; font-weight: bold;');
      }
    }
  }
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

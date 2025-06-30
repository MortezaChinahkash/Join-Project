import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Component that displays legal notice and privacy policy information
 * Supports language switching between German and English
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './legal-notice.component.html',
  styleUrl: './legal-notice.component.scss'
})
export class LegalNoticeComponent {
  /** Currently selected language ('de' for German, 'en' for English) */
  selectedLanguage: string = 'de';

  /**
   * Sets the selected language for the legal notice display
   * @param language - The language code ('de' for German, 'en' for English)
   */
  setLanguage(language: string) {
    this.selectedLanguage = language;
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Component that displays privacy policy information with language switching
 * Supports both German and English content
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent {
  /** Currently selected language ('de' for German, 'en' for English) */
  selectedLanguage: string = 'de';

  /**
   * Sets the selected language for the privacy policy display
   * @param language - The language code ('de' for German, 'en' for English)
   */
  setLanguage(language: string) {
    this.selectedLanguage = language;
  }
}

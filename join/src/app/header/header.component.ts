import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  isOverlayVisible = false;

  toggleOverlay() {
    this.isOverlayVisible = !this.isOverlayVisible;
  }

  closeOverlay() {
    this.isOverlayVisible = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const userElement = document.querySelector('.user');
    const overlayElement = document.querySelector('.mini-overlay');
    
    // Close overlay if clicking outside of user icon and overlay
    if (userElement && overlayElement && 
        !userElement.contains(target) && 
        !overlayElement.contains(target)) {
      this.closeOverlay();
    }
  }
}

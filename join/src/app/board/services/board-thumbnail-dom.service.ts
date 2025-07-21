import { Injectable } from '@angular/core';

/**
 * Service for DOM access and manipulation related to board thumbnails.
 * Handles element queries, style updates, and DOM interactions.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardThumbnailDomService {

  /**
   * Gets the board scroll wrapper element.
   */
  getBoardScrollWrapper(): HTMLElement | null {
    return document.querySelector('.board-scroll-wrapper') as HTMLElement;
  }

  /**
   * Gets the scroll container elements.
   */
  getScrollContainers(): { container: HTMLElement | null; boardContainer: HTMLElement | null } {
    return {
      container: document.querySelector('.board-scroll-wrapper') as HTMLElement,
      boardContainer: document.querySelector('.board-container') as HTMLElement
    };
  }

  /**
   * Gets the thumbnail viewport element.
   */
  getThumbnailViewport(): HTMLElement | null {
    return document.querySelector('.thumbnail-viewport') as HTMLElement;
  }

  /**
   * Disables viewport transition during drag.
   */
  disableViewportTransition(): void {
    const viewport = this.getThumbnailViewport();
    if (viewport) {
      viewport.style.transition = 'none';
    }
  }

  /**
   * Enables viewport transition after drag.
   */
  enableViewportTransition(): void {
    const viewport = this.getThumbnailViewport();
    if (viewport) {
      viewport.style.transition = 'all 0.1s ease';
    }
  }

  /**
   * Extracts click data from mouse event.
   */
  extractClickData(event: MouseEvent): { clickX: number; thumbnailWidth: number } {
    const thumbnail = event.currentTarget as HTMLElement;
    const thumbnailContent = thumbnail.querySelector('.thumbnail-content') as HTMLElement;
    const rect = thumbnailContent.getBoundingClientRect();
    const clickX = event.clientX - rect.left - 4;
    const thumbnailWidth = rect.width - 8;
    
    return { clickX, thumbnailWidth };
  }

  /**
   * Extracts touch data from touch event.
   */
  extractTouchData(event: TouchEvent): { touchX: number; rect: DOMRect; thumbnailWidth: number } {
    const thumbnail = event.currentTarget as HTMLElement;
    const thumbnailContent = thumbnail.querySelector('.thumbnail-content') as HTMLElement;
    const rect = thumbnailContent.getBoundingClientRect();
    const touch = event.touches[0];
    const touchX = touch.clientX - rect.left - 4;
    const thumbnailWidth = rect.width - 8;
    
    return { touchX, rect, thumbnailWidth };
  }

  /**
   * Updates container scroll position.
   */
  updateContainerScroll(scrollPosition: number, updateCallback: () => void): void {
    const container = this.getBoardScrollWrapper();
    if (container) {
      container.scrollLeft = scrollPosition;
      requestAnimationFrame(() => {
        updateCallback();
      });
    }
  }

  /**
   * Scrolls to position with smooth behavior.
   */
  scrollToPosition(scrollPosition: number): void {
    const container = this.getBoardScrollWrapper();
    if (container) {
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }
}

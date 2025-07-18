import { Injectable } from '@angular/core';

/**
 * Service for handling auto-scroll functionality during drag operations.
 * Manages smooth scrolling when dragging near screen edges.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardAutoScrollService {
  
  // Auto-scroll configuration
  autoScrollZone = 200; // pixels from top/bottom where auto-scroll activates
  autoScrollSpeed = 8; // pixels per scroll step
  autoScrollInterval: any = null;
  isAutoScrolling = false;
  currentCursorY = 0; // Track current cursor position

  /**
   * Starts auto-scroll if cursor is in scroll zone.
   * 
   * @param cursorY - Current cursor Y position
   */
  handleAutoScroll(cursorY: number): void {
    this.currentCursorY = cursorY;
    
    const container = this.findScrollableContainer();
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const distanceFromTop = cursorY - containerRect.top;
    const distanceFromBottom = containerRect.bottom - cursorY;

    if (distanceFromTop < this.autoScrollZone || distanceFromBottom < this.autoScrollZone) {
      this.startAutoScroll(container, distanceFromTop, distanceFromBottom);
    } else {
      this.stopAutoScroll();
    }
  }

  /**
   * Emergency auto-scroll for edge cases.
   * 
   * @param event - Mouse or touch event
   */
  emergencyAutoScroll(event: MouseEvent | TouchEvent): void {
    const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
    
    const container = this.findScrollableContainer();
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const relativeY = clientY - containerRect.top;
    const containerHeight = containerRect.height;

    const scrollUpZone = containerHeight * 0.15;
    const scrollDownZone = containerHeight * 0.85;

    if (relativeY < scrollUpZone && container.scrollTop > 0) {
      const scrollSpeed = this.getAdaptiveScrollSpeed(scrollUpZone - relativeY);
      container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
    } else if (relativeY > scrollDownZone) {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (container.scrollTop < maxScroll) {
        const scrollSpeed = this.getAdaptiveScrollSpeed(relativeY - scrollDownZone);
        container.scrollTop = Math.min(maxScroll, container.scrollTop + scrollSpeed);
      }
    }
  }

  /**
   * Starts auto-scroll with specified parameters.
   * 
   * @param container - Container to scroll
   * @param distanceFromTop - Distance from top edge
   * @param distanceFromBottom - Distance from bottom edge
   */
  private startAutoScroll(container: HTMLElement, distanceFromTop: number, distanceFromBottom: number): void {
    if (this.isAutoScrolling) return;

    this.isAutoScrolling = true;
    this.autoScrollInterval = setInterval(() => {
      if (distanceFromTop < this.autoScrollZone && container.scrollTop > 0) {
        const scrollSpeed = this.getAdaptiveScrollSpeed(this.autoScrollZone - distanceFromTop);
        container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
      } else if (distanceFromBottom < this.autoScrollZone) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (container.scrollTop < maxScroll) {
          const scrollSpeed = this.getAdaptiveScrollSpeed(this.autoScrollZone - distanceFromBottom);
          container.scrollTop = Math.min(maxScroll, container.scrollTop + scrollSpeed);
        }
      } else {
        this.stopAutoScroll();
      }
    }, 16); // ~60fps for smooth scrolling
  }

  /**
   * Stops auto-scroll.
   */
  stopAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
    this.isAutoScrolling = false;
  }

  /**
   * Calculates adaptive scroll speed based on distance from edge.
   * 
   * @param distance - Distance from scroll zone edge
   * @returns Calculated scroll speed
   */
  private getAdaptiveScrollSpeed(distance: number): number {
    const maxSpeed = this.autoScrollSpeed * 2;
    const minSpeed = this.autoScrollSpeed * 0.3;
    const normalizedDistance = Math.max(0, Math.min(1, distance / this.autoScrollZone));
    return maxSpeed - (normalizedDistance * (maxSpeed - minSpeed));
  }

  /**
   * Finds the scrollable container element.
   * 
   * @returns Scrollable container or null
   */
  private findScrollableContainer(): HTMLElement | null {
    // Try to find main content area first
    let container = document.querySelector('.main-content') as HTMLElement;
    if (container && this.isScrollable(container)) {
      return container;
    }

    // Fallback to document body
    container = document.body;
    if (this.isScrollable(container)) {
      return container;
    }

    // Last resort: document element
    return document.documentElement;
  }

  /**
   * Checks if an element is scrollable.
   * 
   * @param element - Element to check
   * @returns True if element is scrollable
   */
  private isScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    return (overflowY === 'scroll' || overflowY === 'auto') && 
           element.scrollHeight > element.clientHeight;
  }

  /**
   * Cleanup method to stop all auto-scroll operations.
   */
  cleanup(): void {
    this.stopAutoScroll();
  }
}

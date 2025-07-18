import { Injectable } from '@angular/core';
import { TaskColumn } from '../../../interfaces/task.interface';

/**
 * Service for handling auto-scroll functionality during drag operations.
 * Manages viewport scrolling when dragging near screen edges.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragAutoScrollService {
  private autoScrollZone = 200; // pixels from top/bottom where auto-scroll activates
  private autoScrollSpeed = 8; // pixels per scroll step
  private autoScrollInterval: any = null;
  private isAutoScrolling = false;

  /**
   * Handles auto-scrolling when dragging tasks near the top or bottom of the viewport.
   * Starts auto-scroll if cursor is in the scroll zone, stops it otherwise.
   * 
   * @param clientY - Current Y position of cursor/touch
   */
  handleAutoScroll(clientY: number): void {
    const viewportHeight = window.innerHeight;
    const scrollZone = this.autoScrollZone;
    
    // Check if we're in the auto-scroll zone
    const isInTopZone = clientY < scrollZone;
    const isInBottomZone = clientY > (viewportHeight - scrollZone);
    
    if (isInTopZone || isInBottomZone) {
      this.startAutoScroll(clientY, viewportHeight, isInTopZone);
    } else {
      this.stopAutoScroll();
    }
  }

  /**
   * Starts auto-scroll in the specified direction.
   * 
   * @param clientY - Current cursor Y position
   * @param viewportHeight - Height of the viewport
   * @param isUpward - True if scrolling upward, false for downward
   * @private
   */
  private startAutoScroll(clientY: number, viewportHeight: number, isUpward: boolean): void {
    if (this.isAutoScrolling) return;
    
    this.isAutoScrolling = true;
    
    this.autoScrollInterval = setInterval(() => {
      const distance = isUpward ? 
        (this.autoScrollZone - clientY) : 
        (clientY - (viewportHeight - this.autoScrollZone));
      
      const scrollSpeed = this.getAdaptiveScrollSpeed(distance);
      const scrollDirection = isUpward ? -scrollSpeed : scrollSpeed;
      
      window.scrollBy(0, scrollDirection);
    }, 16); // ~60fps
  }

  /**
   * Stops auto-scrolling and cleans up the interval.
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
   * @param distance - Distance from the edge of scroll zone
   * @returns Calculated scroll speed
   * @private
   */
  private getAdaptiveScrollSpeed(distance: number): number {
    // Increase speed as cursor gets closer to edge
    const speedMultiplier = Math.max(1, Math.min(3, distance / 50));
    return this.autoScrollSpeed * speedMultiplier;
  }

  /**
   * Emergency auto-scroll implementation for touch devices.
   * Scrolls the main content container for better mobile support.
   * 
   * @param event - Mouse or touch event
   */
  emergencyAutoScroll(event: MouseEvent | TouchEvent): void {
    const scrollSpeed = 15;
    const scrollZone = 100;
    const viewportHeight = window.innerHeight;
    
    let clientY: number;
    if (event instanceof MouseEvent) {
      clientY = event.clientY;
    } else {
      const touch = event.touches[0];
      clientY = touch ? touch.clientY : 0;
    }
    
    // Find scrollable container
    const scrollContainer = this.findScrollableContainer();
    if (!scrollContainer) return;
    
    // Auto-scroll logic
    if (clientY < scrollZone) {
      scrollContainer.scrollTop -= scrollSpeed;
    } else if (clientY > viewportHeight - scrollZone) {
      scrollContainer.scrollTop += scrollSpeed;
    }
  }

  /**
   * Finds the scrollable container element in the DOM.
   * 
   * @returns Scrollable HTML element or null if not found
   * @private
   */
  private findScrollableContainer(): HTMLElement | null {
    // Try main content area first
    let container = document.querySelector('.main-content') as HTMLElement;
    if (container && this.isScrollable(container)) {
      return container;
    }
    
    // Try body as fallback
    container = document.querySelector('body') as HTMLElement;
    if (container && this.isScrollable(container)) {
      return container;
    }
    
    // Try document element
    return document.documentElement;
  }

  /**
   * Checks if an element is scrollable.
   * 
   * @param element - Element to check
   * @returns True if element is scrollable
   * @private
   */
  private isScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    return overflowY === 'scroll' || overflowY === 'auto' || element.scrollHeight > element.clientHeight;
  }

  /**
   * Cleans up all auto-scroll related resources.
   * Should be called when component is destroyed.
   */
  cleanup(): void {
    this.stopAutoScroll();
  }
}

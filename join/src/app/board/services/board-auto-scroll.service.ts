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
  autoScrollZone = 200; // pixels from edges where auto-scroll activates
  autoScrollSpeed = 8; // pixels per scroll step
  autoScrollInterval: any = null;
  horizontalScrollInterval: any = null;
  isAutoScrolling = false;
  isHorizontalScrolling = false;
  currentCursorY = 0; // Track current cursor position
  currentCursorX = 0; // Track current cursor position
  /**
   * Starts auto-scroll if cursor is in scroll zone.
   * 
   * @param cursorX - Current cursor X position
   * @param cursorY - Current cursor Y position
   */
  handleAutoScroll(cursorX: number, cursorY: number): void {
    this.currentCursorX = cursorX;
    this.currentCursorY = cursorY;
    
    // Handle vertical scrolling
    this.handleVerticalScroll(cursorY);
    
    // Handle horizontal scrolling
    this.handleHorizontalScroll(cursorX);
  }
  
  /**
   * Handles vertical auto-scroll.
   * 
   * @param cursorY - Current cursor Y position
   */
  private handleVerticalScroll(cursorY: number): void {
    const container = this.findScrollableContainer();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const distanceFromTop = cursorY - containerRect.top;
    const distanceFromBottom = containerRect.bottom - cursorY;
    
    // Check if we can scroll vertically
    if (this.canScrollVertically(container)) {
      if (distanceFromTop < this.autoScrollZone || distanceFromBottom < this.autoScrollZone) {
        this.startVerticalAutoScroll(container, distanceFromTop, distanceFromBottom);
      } else {
        this.stopVerticalAutoScroll();
      }
    } else {
      // If we can't scroll vertically, try to find a parent that can
      const parentContainer = this.findVerticalScrollableParent(container);
      if (parentContainer) {
        const parentRect = parentContainer.getBoundingClientRect();
        const parentDistanceFromTop = cursorY - parentRect.top;
        const parentDistanceFromBottom = parentRect.bottom - cursorY;
        
        if (parentDistanceFromTop < this.autoScrollZone || parentDistanceFromBottom < this.autoScrollZone) {
          this.startVerticalAutoScroll(parentContainer, parentDistanceFromTop, parentDistanceFromBottom);
        } else {
          this.stopVerticalAutoScroll();
        }
      } else {
        this.stopVerticalAutoScroll();
      }
    }
  }
  
  /**
   * Handles horizontal auto-scroll.
   * 
   * @param cursorX - Current cursor X position
   */
  private handleHorizontalScroll(cursorX: number): void {
    const container = this.findHorizontalScrollableContainer();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const distanceFromLeft = cursorX - containerRect.left;
    const distanceFromRight = containerRect.right - cursorX;
    
    if (this.canScrollHorizontally(container)) {
      if (distanceFromLeft < this.autoScrollZone || distanceFromRight < this.autoScrollZone) {
        this.startHorizontalAutoScroll(container, distanceFromLeft, distanceFromRight);
      } else {
        this.stopHorizontalAutoScroll();
      }
    } else {
      this.stopHorizontalAutoScroll();
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
   * Starts vertical auto-scroll with specified parameters.
   * 
   * @param container - Container to scroll
   * @param distanceFromTop - Distance from top edge
   * @param distanceFromBottom - Distance from bottom edge
   */
  private startVerticalAutoScroll(container: HTMLElement, distanceFromTop: number, distanceFromBottom: number): void {
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
        this.stopVerticalAutoScroll();
      }
    }, 16); // ~60fps for smooth scrolling
  }
  
  /**
   * Starts horizontal auto-scroll with specified parameters.
   * 
   * @param container - Container to scroll
   * @param distanceFromLeft - Distance from left edge
   * @param distanceFromRight - Distance from right edge
   */
  private startHorizontalAutoScroll(container: HTMLElement, distanceFromLeft: number, distanceFromRight: number): void {
    if (this.isHorizontalScrolling) return;
    this.isHorizontalScrolling = true;
    this.horizontalScrollInterval = setInterval(() => {
      if (distanceFromLeft < this.autoScrollZone && container.scrollLeft > 0) {
        const scrollSpeed = this.getAdaptiveScrollSpeed(this.autoScrollZone - distanceFromLeft);
        container.scrollLeft = Math.max(0, container.scrollLeft - scrollSpeed);
      } else if (distanceFromRight < this.autoScrollZone) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft < maxScroll) {
          const scrollSpeed = this.getAdaptiveScrollSpeed(this.autoScrollZone - distanceFromRight);
          container.scrollLeft = Math.min(maxScroll, container.scrollLeft + scrollSpeed);
        }
      } else {
        this.stopHorizontalAutoScroll();
      }
    }, 16); // ~60fps for smooth scrolling
  }
  /**
   * Stops vertical auto-scroll.
   */
  stopVerticalAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
    this.isAutoScrolling = false;
  }
  
  /**
   * Stops horizontal auto-scroll.
   */
  stopHorizontalAutoScroll(): void {
    if (this.horizontalScrollInterval) {
      clearInterval(this.horizontalScrollInterval);
      this.horizontalScrollInterval = null;
    }
    this.isHorizontalScrolling = false;
  }
  
  /**
   * Stops all auto-scroll.
   */
  stopAutoScroll(): void {
    this.stopVerticalAutoScroll();
    this.stopHorizontalAutoScroll();
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
    let container = document.querySelector('.main') as HTMLElement;
    if (container && this.canScrollVertically(container)) {
      return container;
    }
    
    // Try alternative selectors
    container = document.querySelector('.main-content') as HTMLElement;
    if (container && this.canScrollVertically(container)) {
      return container;
    }
    
    // Try board container
    container = document.querySelector('.board-container') as HTMLElement;
    if (container && this.canScrollVertically(container)) {
      return container;
    }
    
    // Try board scroll wrapper (even if it's horizontal, might have vertical parent)
    container = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (container) {
      // Even if this container isn't vertically scrollable, return it so we can find its parent
      return container;
    }
    
    // Try content container
    container = document.querySelector('.content') as HTMLElement;
    if (container && this.canScrollVertically(container)) {
      return container;
    }
    
    // Try page container
    container = document.querySelector('.page') as HTMLElement;
    if (container && this.canScrollVertically(container)) {
      return container;
    }
    
    // Fallback to document body
    container = document.body;
    if (this.canScrollVertically(container)) {
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
   * Checks if an element can scroll vertically.
   * 
   * @param element - Element to check
   * @returns True if element can scroll vertically
   */
  private canScrollVertically(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    return (overflowY === 'scroll' || overflowY === 'auto') && 
           element.scrollHeight > element.clientHeight;
  }
  
  /**
   * Finds a parent element that can scroll vertically.
   * 
   * @param element - Starting element
   * @returns Vertically scrollable parent or null
   */
  private findVerticalScrollableParent(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;
    while (parent) {
      if (this.canScrollVertically(parent)) {
        return parent;
      }
      parent = parent.parentElement;
    }
    
    // Check document body and html as fallbacks
    if (this.canScrollVertically(document.body)) {
      return document.body;
    }
    
    if (this.canScrollVertically(document.documentElement)) {
      return document.documentElement;
    }
    
    return null;
  }
  
  /**
   * Checks if an element can scroll horizontally.
   * 
   * @param element - Element to check
   * @returns True if element can scroll horizontally
   */
  private canScrollHorizontally(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowX = style.overflowX;
    return (overflowX === 'scroll' || overflowX === 'auto') && 
           element.scrollWidth > element.clientWidth;
  }
  
  /**
   * Finds the horizontal scrollable container element.
   * 
   * @returns Horizontal scrollable container or null
   */
  private findHorizontalScrollableContainer(): HTMLElement | null {
    // Try to find board scroll wrapper first (this is the main horizontal scroll container)
    let container = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (container && this.canScrollHorizontally(container)) {
      return container;
    }
    
    // Try board container
    container = document.querySelector('.board-container') as HTMLElement;
    if (container && this.canScrollHorizontally(container)) {
      return container;
    }
    
    // Try main content area
    container = document.querySelector('.main') as HTMLElement;
    if (container && this.canScrollHorizontally(container)) {
      return container;
    }
    
    // Try content container
    container = document.querySelector('.content') as HTMLElement;
    if (container && this.canScrollHorizontally(container)) {
      return container;
    }
    
    // Fallback to document body
    container = document.body;
    if (this.canScrollHorizontally(container)) {
      return container;
    }
    
    // Last resort: document element
    if (this.canScrollHorizontally(document.documentElement)) {
      return document.documentElement;
    }
    
    return null;
  }

  /**
   * Cleanup method to stop all auto-scroll operations.
   */
  cleanup(): void {
    this.stopAutoScroll();
  }
}

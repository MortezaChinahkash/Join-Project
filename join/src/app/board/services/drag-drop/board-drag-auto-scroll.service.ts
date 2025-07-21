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
  private autoScrollZone = 200;
  private autoScrollSpeed = 8;
  private autoScrollInterval: any = null;
  private horizontalScrollInterval: any = null;
  private isAutoScrolling = false;
  private isHorizontalScrolling = false;
  /**
   * Handles auto-scrolling when dragging tasks near the top or bottom of the viewport.
   * Starts auto-scroll if cursor is in the scroll zone, stops it otherwise.
   * 
   * @param clientX - Current X position of cursor/touch (for horizontal scrolling)
   * @param clientY - Current Y position of cursor/touch (for vertical scrolling)
   */
  handleAutoScroll(clientX: number, clientY?: number): void {
    const actualClientY = clientY !== undefined ? clientY : clientX;
    const actualClientX = clientY !== undefined ? clientX : 0;
    
    this.handleVerticalScroll(actualClientY);
    if (clientY !== undefined) {
      this.handleHorizontalScroll(actualClientX);
    }
  }
  
  /**
   * Handles horizontal auto-scrolling for board container.
   * 
   * @param clientX - Current X position of cursor/touch
   */
  private handleHorizontalScroll(clientX: number): void {
    const boardScrollWrapper = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (!boardScrollWrapper) return;
    
    const containerRect = boardScrollWrapper.getBoundingClientRect();
    const scrollZone = this.autoScrollZone;
    
    const distanceFromLeft = clientX - containerRect.left;
    const distanceFromRight = containerRect.right - clientX;
    
    const isInLeftZone = distanceFromLeft < scrollZone && distanceFromLeft > 0;
    const isInRightZone = distanceFromRight < scrollZone && distanceFromRight > 0;
    
    if (isInLeftZone || isInRightZone) {
      this.startHorizontalAutoScroll(boardScrollWrapper, isInLeftZone);
    } else {
      this.stopHorizontalAutoScroll();
    }
  }
  
  /**
   * Handles vertical auto-scrolling.
   * 
   * @param clientY - Current Y position of cursor/touch
   */
  private handleVerticalScroll(clientY: number): void {
    const viewportHeight = window.innerHeight;
    const scrollZone = this.autoScrollZone;
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
    }, 16);
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
   * Starts horizontal auto-scrolling for the board container.
   * 
   * @param container - The container element to scroll
   * @param isScrollingLeft - True if scrolling left, false for right
   * @private
   */
  private startHorizontalAutoScroll(container: HTMLElement, isScrollingLeft: boolean): void {
    if (this.isHorizontalScrolling) return;
    
    this.isHorizontalScrolling = true;
    this.horizontalScrollInterval = setInterval(() => {
      const scrollAmount = isScrollingLeft ? -this.autoScrollSpeed : this.autoScrollSpeed;
      container.scrollLeft += scrollAmount;
      
      if (isScrollingLeft && container.scrollLeft <= 0) {
        this.stopHorizontalAutoScroll();
      } else if (!isScrollingLeft && container.scrollLeft >= container.scrollWidth - container.clientWidth) {

        this.stopHorizontalAutoScroll();
      }
    }, 16);
  }

  /**
   * Stops horizontal auto-scrolling and cleans up the interval.
   */
  private stopHorizontalAutoScroll(): void {
    if (this.horizontalScrollInterval) {
      clearInterval(this.horizontalScrollInterval);
      this.horizontalScrollInterval = null;
    }
    this.isHorizontalScrolling = false;
  }

  /**
   * Calculates adaptive scroll speed based on distance from edge.
   * 
   * @param distance - Distance from the edge of scroll zone
   * @returns Calculated scroll speed
   * @private
   */
  private getAdaptiveScrollSpeed(distance: number): number {
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
    const scrollContainer = this.findScrollableContainer();
    if (!scrollContainer) return;
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
    let container = document.querySelector('.main-content') as HTMLElement;
    if (container && this.isScrollable(container)) {
      return container;
    }
    container = document.querySelector('body') as HTMLElement;
    if (container && this.isScrollable(container)) {
      return container;
    }
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
    this.stopHorizontalAutoScroll();
  }
}

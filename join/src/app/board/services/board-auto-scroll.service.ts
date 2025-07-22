import { Injectable } from '@angular/core';
import { BoardScrollContainerService } from './board-scroll-container.service';

/**
 * Service for handling auto-scroll functionality during drag operations.
 * Manages smooth scrolling when dragging near screen edges.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardAutoScrollService {
  autoScrollZone = 200;
  autoScrollSpeed = 8;
  autoScrollInterval: any = null;
  horizontalScrollInterval: any = null;
  isAutoScrolling = false;
  isHorizontalScrolling = false;
  currentCursorY = 0;
  currentCursorX = 0;

  /** Constructor initializes auto-scroll service with container service */
  constructor(private containerService: BoardScrollContainerService) {}

  /**
   * Starts auto-scroll if cursor is in scroll zone.
   * 
   * @param cursorX - Current cursor X position
   * @param cursorY - Current cursor Y position
   */
  handleAutoScroll(cursorX: number, cursorY: number): void {
    this.currentCursorX = cursorX;
    this.currentCursorY = cursorY;
    
    this.handleVerticalScroll(cursorY);
    this.handleHorizontalScroll(cursorX);
  }

  /**
   * Handles vertical auto-scroll.
   * 
   * @param cursorY - Current cursor Y position
   */
  private handleVerticalScroll(cursorY: number): void {
    const container = this.containerService.findScrollableContainer();
    if (!container) return;
    
    if (this.containerService.canScrollVertically(container)) {
      this.handleContainerVerticalScroll(container, cursorY);
    } else {
      this.handleParentVerticalScroll(container, cursorY);
    }
  }

  /**
   * Handles vertical scroll for the main container.
   */
  private handleContainerVerticalScroll(container: HTMLElement, cursorY: number): void {
    const containerRect = container.getBoundingClientRect();
    const distanceFromTop = cursorY - containerRect.top;
    const distanceFromBottom = containerRect.bottom - cursorY;
    
    if (distanceFromTop < this.autoScrollZone || distanceFromBottom < this.autoScrollZone) {
      this.startVerticalAutoScroll(container, distanceFromTop, distanceFromBottom);
    } else {
      this.stopVerticalAutoScroll();
    }
  }

  /**
   * Handles vertical scroll for parent containers.
   */
  private handleParentVerticalScroll(container: HTMLElement, cursorY: number): void {
    const parentContainer = this.containerService.findVerticalScrollableParent(container);
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

  /**
   * Handles horizontal auto-scroll.
   * 
   * @param cursorX - Current cursor X position
   */
  private handleHorizontalScroll(cursorX: number): void {
    const container = this.containerService.findHorizontalScrollableContainer();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const distanceFromLeft = cursorX - containerRect.left;
    const distanceFromRight = containerRect.right - cursorX;
    
    if (this.containerService.canScrollHorizontally(container)) {
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
    const container = this.containerService.findScrollableContainer();
    if (!container) return;
    
    const scrollData = this.calculateEmergencyScrollData(container, clientY);
    this.performEmergencyScroll(container, scrollData);
  }

  /**
   * Calculates scroll zones and relative position for emergency scroll.
   */
  private calculateEmergencyScrollData(container: HTMLElement, clientY: number) {
    const containerRect = container.getBoundingClientRect();
    const relativeY = clientY - containerRect.top;
    const containerHeight = containerRect.height;
    
    return {
      relativeY,
      scrollUpZone: containerHeight * 0.15,
      scrollDownZone: containerHeight * 0.85
    };
  }

  /**
   * Performs the emergency scroll action based on calculated data.
   */
  private performEmergencyScroll(container: HTMLElement, scrollData: any): void {
    const { relativeY, scrollUpZone, scrollDownZone } = scrollData;
    
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
      this.executeVerticalScroll(container, distanceFromTop, distanceFromBottom);
    }, 16);
  }

  /**
   * Executes the vertical scroll action within the interval.
   */
  private executeVerticalScroll(container: HTMLElement, distanceFromTop: number, distanceFromBottom: number): void {
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
      this.executeHorizontalScroll(container, distanceFromLeft, distanceFromRight);
    }, 16);
  }

  /**
   * Executes the horizontal scroll action within the interval.
   */
  private executeHorizontalScroll(container: HTMLElement, distanceFromLeft: number, distanceFromRight: number): void {
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
   * Cleanup method to stop all auto-scroll operations.
   */
  cleanup(): void {
    this.stopAutoScroll();
  }
}

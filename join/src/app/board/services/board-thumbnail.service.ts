import { Injectable } from '@angular/core';
/**
 * Service for handling board thumbnail navigation and scroll functionality.
 * Manages horizontal scrolling overview, viewport tracking, and thumbnail interactions.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
/**
 * Service for managing board thumbnail displays and navigation.
 * Handles thumbnail generation, view switching, and miniature board representations.
 * 
 * This service provides methods for:
 * - Board thumbnail generation and caching
 * - Thumbnail navigation and view switching
 * - Miniature board layout calculations
 * - Thumbnail update synchronization with main board
 * - Performance-optimized thumbnail rendering
 * - Thumbnail interaction event handling
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 * @since 2024
 */
@Injectable({
  providedIn: 'root'
})
export class BoardThumbnailService {
  scrollPosition = 0;
  maxScrollPosition = 0;
  scrollPercentage = 0;
  thumbWidth = 100;
  showScrollOverview = false;
  thumbnailViewport = {
    left: 0,
    width: 50,
    height: 96
  };
  isDragging = false;
  isViewportDragging = false;
  dragStartX = 0;
  dragStartScrollLeft = 0;
  /**
   * Handles thumbnail click events for navigation.
   * Calculates scroll position based on click location and smoothly scrolls to target position.
   * 
   * @param event - The mouse click event on the thumbnail
   */
  onThumbnailClick(event: MouseEvent) {
    if (this.isDragging || this.isViewportDragging) return;
    event.stopPropagation();
    const thumbnail = event.currentTarget as HTMLElement;
    const thumbnailContent = thumbnail.querySelector('.thumbnail-content') as HTMLElement;
    const rect = thumbnailContent.getBoundingClientRect();
    const clickX = event.clientX - rect.left - 4;
    const thumbnailWidth = rect.width - 8;
    const viewportWidth = this.thumbnailViewport.width;
    const availableClickWidth = thumbnailWidth - viewportWidth;
    const adjustedClickX = Math.max(0, Math.min(availableClickWidth, clickX - (viewportWidth / 2)));
    const percentage = availableClickWidth > 0 ? (adjustedClickX / availableClickWidth) * 100 : 0;
    const container = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (container) {
      const scrollPosition = (percentage / 100) * this.maxScrollPosition;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }

  /**
   * Handles viewport drag start for thumbnail navigation.
   * Initiates viewport dragging and sets up mouse event listeners for smooth drag interaction.
   * 
   * @param event - The mouse down event on the viewport
   */
  onViewportMouseDown(event: MouseEvent) {
    this.initializeViewportDrag(event);
    this.setupMouseEventListeners();
  }

  /**
   * Initializes viewport dragging state and DOM elements.
   */
  private initializeViewportDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isViewportDragging = true;
    this.dragStartX = event.clientX;
    
    const container = this.getBoardScrollWrapper();
    if (container) {
      this.dragStartScrollLeft = container.scrollLeft;
    }
    
    this.disableViewportTransition();
  }

  /**
   * Gets the board scroll wrapper element.
   */
  private getBoardScrollWrapper(): HTMLElement | null {
    return document.querySelector('.board-scroll-wrapper') as HTMLElement;
  }

  /**
   * Disables viewport transition during drag.
   */
  private disableViewportTransition(): void {
    const viewport = document.querySelector('.thumbnail-viewport') as HTMLElement;
    if (viewport) {
      viewport.style.transition = 'none';
    }
  }

  /**
   * Sets up mouse event listeners for viewport dragging.
   */
  private setupMouseEventListeners(): void {
    const handleMouseMove = this.createMouseMoveHandler();
    const handleMouseUp = this.createMouseUpHandler(handleMouseMove);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
  }

  /**
   * Creates mouse move handler for viewport dragging.
   */
  private createMouseMoveHandler(): (e: MouseEvent) => void {
    return (e: MouseEvent) => {
      if (!this.isViewportDragging) return;
      e.preventDefault();
      
      const deltaX = e.clientX - this.dragStartX;
      const scrollPosition = this.calculateNewScrollPosition(deltaX);
      this.updateContainerScroll(scrollPosition);
    };
  }

  /**
   * Calculates new scroll position based on drag delta.
   */
  private calculateNewScrollPosition(deltaX: number): number {
    const thumbnailWidth = 192;
    const viewportWidth = this.thumbnailViewport.width;
    const availableDragWidth = thumbnailWidth - viewportWidth;
    const scrollRatio = availableDragWidth > 0 ? this.maxScrollPosition / availableDragWidth : 0;
    const newScrollLeft = this.dragStartScrollLeft + (deltaX * scrollRatio);
    
    return Math.max(0, Math.min(this.maxScrollPosition, newScrollLeft));
  }

  /**
   * Updates container scroll position.
   */
  private updateContainerScroll(scrollPosition: number): void {
    const container = this.getBoardScrollWrapper();
    if (container) {
      container.scrollLeft = scrollPosition;
      requestAnimationFrame(() => {
        this.updateScrollPosition();
      });
    }
  }

  /**
   * Creates mouse up handler for ending viewport drag.
   */
  private createMouseUpHandler(handleMouseMove: (e: MouseEvent) => void): () => void {
    return () => {
      this.finalizeDragOperation();
      this.removeMouseEventListeners(handleMouseMove);
    };
  }

  /**
   * Finalizes drag operation and restores viewport transition.
   */
  private finalizeDragOperation(): void {
    this.isViewportDragging = false;
    const viewport = document.querySelector('.thumbnail-viewport') as HTMLElement;
    if (viewport) {
      viewport.style.transition = 'all 0.1s ease';
    }
  }

  /**
   * Removes mouse event listeners.
   */
  private removeMouseEventListeners(handleMouseMove: (e: MouseEvent) => void): void {
    const handleMouseUp = () => {
      this.finalizeDragOperation();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
    
    handleMouseUp();
  }

  /**
   * Handles viewport touch start for thumbnail navigation on touch devices.
   * Initiates viewport dragging and sets up touch event listeners for smooth drag interaction.
   * 
   * @param event - The touch start event on the viewport
   */
  onViewportTouchStart(event: TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isViewportDragging = true;
    const touch = event.touches[0];
    this.dragStartX = touch.clientX;
    const container = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (container) {
      this.dragStartScrollLeft = container.scrollLeft;
    }
    const viewport = document.querySelector('.thumbnail-viewport') as HTMLElement;
    if (viewport) {
      viewport.style.transition = 'none';
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (!this.isViewportDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.dragStartX;
      const thumbnailWidth = 192;
      const viewportWidth = this.thumbnailViewport.width;
      const availableDragWidth = thumbnailWidth - viewportWidth;
      const scrollRatio = availableDragWidth > 0 ? this.maxScrollPosition / availableDragWidth : 0;
      const newScrollLeft = this.dragStartScrollLeft + (deltaX * scrollRatio);
      if (container) {
        const clampedScroll = Math.max(0, Math.min(this.maxScrollPosition, newScrollLeft));
        container.scrollLeft = clampedScroll;
        requestAnimationFrame(() => {
          this.updateScrollPosition();
        });
      }
    };
    const handleTouchEnd = () => {
      this.isViewportDragging = false;
      if (viewport) {
        viewport.style.transition = 'all 0.1s ease';
      }
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  }

  /**
   * Handles thumbnail touch events for navigation on touch devices.
   * Calculates scroll position based on touch location and smoothly scrolls to target position.
   * 
   * @param event - The touch event on the thumbnail
   */
  onThumbnailTouchStart(event: TouchEvent) {
    if (this.shouldIgnoreThumbnailTouch()) return;
    
    event.stopPropagation();
    const touchData = this.extractTouchData(event);
    const scrollPercentage = this.calculateTouchScrollPercentage(touchData);
    this.scrollToTouchPosition(scrollPercentage);
  }

  /**
   * Checks if thumbnail touch should be ignored.
   */
  private shouldIgnoreThumbnailTouch(): boolean {
    return this.isDragging || this.isViewportDragging;
  }

  /**
   * Extracts touch data from touch event.
   */
  private extractTouchData(event: TouchEvent): { touchX: number; rect: DOMRect; thumbnailWidth: number } {
    const thumbnail = event.currentTarget as HTMLElement;
    const thumbnailContent = thumbnail.querySelector('.thumbnail-content') as HTMLElement;
    const rect = thumbnailContent.getBoundingClientRect();
    const touch = event.touches[0];
    const touchX = touch.clientX - rect.left - 4;
    const thumbnailWidth = rect.width - 8;
    
    return { touchX, rect, thumbnailWidth };
  }

  /**
   * Calculates scroll percentage based on touch position.
   */
  private calculateTouchScrollPercentage(touchData: { touchX: number; thumbnailWidth: number }): number {
    const { touchX, thumbnailWidth } = touchData;
    const viewportWidth = this.thumbnailViewport.width;
    const availableClickWidth = thumbnailWidth - viewportWidth;
    const adjustedTouchX = Math.max(0, Math.min(availableClickWidth, touchX - (viewportWidth / 2)));
    
    return availableClickWidth > 0 ? (adjustedTouchX / availableClickWidth) * 100 : 0;
  }

  /**
   * Scrolls to position based on touch percentage.
   */
  private scrollToTouchPosition(percentage: number): void {
    const container = this.getBoardScrollWrapper();
    if (container) {
      const scrollPosition = (percentage / 100) * this.maxScrollPosition;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }

  /**
   * Updates scroll position and thumbnail viewport calculations.
   * Determines if scroll overview should be shown based on window width and content overflow.
   * 
   * @private
   */
  updateScrollPosition() {
    const container = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    const boardContainer = document.querySelector('.board-container') as HTMLElement;
    if (container && boardContainer) {
      this.scrollPosition = container.scrollLeft;
      this.maxScrollPosition = boardContainer.scrollWidth - container.clientWidth;
      const windowWidth = window.innerWidth;
      const shouldShowScroll = windowWidth >= 1000 && windowWidth <= 1750 && this.maxScrollPosition > 0;
      this.showScrollOverview = shouldShowScroll;
      if (this.maxScrollPosition > 0) {
        this.scrollPercentage = (this.scrollPosition / this.maxScrollPosition) * 100;
        this.thumbWidth = (container.clientWidth / boardContainer.scrollWidth) * 100;
        this.updateThumbnailViewport(container, boardContainer);
      } else {
        this.scrollPercentage = 0;
        this.thumbWidth = 100;
      }
    }
  }

  /**
   * Updates the thumbnail viewport position and size based on current scroll state.
   * Calculates viewport dimensions and position within the thumbnail for accurate representation.
   * 
   * @param container - The main scroll container element
   * @param boardContainer - The board container element with all columns
   * @private
   */
  private updateThumbnailViewport(container: HTMLElement, boardContainer: HTMLElement) {
    const thumbnailWidth = 192;
    const containerWidth = container.clientWidth;
    const scrollWidth = boardContainer.scrollWidth;
    const viewportWidthRatio = containerWidth / scrollWidth;
    const viewportPositionRatio = this.maxScrollPosition > 0 ? this.scrollPosition / this.maxScrollPosition : 0;
    const viewportWidth = Math.min(thumbnailWidth, Math.max(20, viewportWidthRatio * thumbnailWidth));
    const viewportLeft = Math.max(0, Math.min(thumbnailWidth - viewportWidth, viewportPositionRatio * (thumbnailWidth - viewportWidth)));
    this.thumbnailViewport = {
      left: viewportLeft,
      width: viewportWidth,
      height: 96
    };
  }

  /**
   * Sets up scroll event listeners and window resize handlers.
   * Initializes scroll position calculations with multiple attempts to ensure proper loading.
   */
  setupScrollListener() {
    const container = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (container) {
      let isScrolling = false;
      container.addEventListener('scroll', () => {
        if (!isScrolling) {
          isScrolling = true;
          requestAnimationFrame(() => {
            this.updateScrollPosition();
            isScrolling = false;
          });
        }
      });
      window.addEventListener('resize', () => {
        setTimeout(() => {
          this.updateScrollPosition();
        }, 100);
      });
      setTimeout(() => {
        this.updateScrollPosition();
      }, 100);

      setTimeout(() => {
        this.updateScrollPosition();
      }, 500);

      setTimeout(() => {
        this.updateScrollPosition();
      }, 1000);
    }
  }

  /**
   * Resets all thumbnail and scroll state variables.
   * Useful for cleanup when component is destroyed.
   */
  resetThumbnailState() {
    this.isDragging = false;
    this.isViewportDragging = false;
    this.dragStartX = 0;
    this.dragStartScrollLeft = 0;
    this.scrollPosition = 0;
    this.maxScrollPosition = 0;
    this.scrollPercentage = 0;
    this.thumbWidth = 100;
    this.showScrollOverview = false;
  }

  /**
   * Handles viewport click events.
   * Provides click feedback while preventing drag interference.
   * 
   * @param event - The mouse click event on the viewport
   */
  onViewportClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
  }
}

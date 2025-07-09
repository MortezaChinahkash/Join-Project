import { Injectable } from '@angular/core';

/**
 * Service for handling board thumbnail navigation and scroll functionality.
 * Manages horizontal scrolling overview, viewport tracking, and thumbnail interactions.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardThumbnailService {
  // Scroll properties for horizontal overview
  scrollPosition = 0;
  maxScrollPosition = 0;
  scrollPercentage = 0;
  thumbWidth = 100;
  showScrollOverview = false;
  
  // Thumbnail viewport tracking
  thumbnailViewport = {
    left: 0,
    width: 50,
    height: 96
  };

  // Drag and drop properties for thumbnail
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
    if (this.isDragging || this.isViewportDragging) return; // Don't handle click if we were dragging
    
    event.stopPropagation();
    const thumbnail = event.currentTarget as HTMLElement;
    const thumbnailContent = thumbnail.querySelector('.thumbnail-content') as HTMLElement;
    const rect = thumbnailContent.getBoundingClientRect();
    const clickX = event.clientX - rect.left - 4; // Account for padding
    const thumbnailWidth = rect.width - 8; // Account for padding
    
    // Calculate the available click area (thumbnail width minus viewport width)
    const viewportWidth = this.thumbnailViewport.width;
    const availableClickWidth = thumbnailWidth - viewportWidth;
    
    // Adjust click position to account for viewport width
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
    event.preventDefault();
    event.stopPropagation();
    
    this.isViewportDragging = true;
    this.dragStartX = event.clientX;
    
    const container = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (container) {
      this.dragStartScrollLeft = container.scrollLeft;
    }

    // Disable transitions during drag for immediate response
    const viewport = document.querySelector('.thumbnail-viewport') as HTMLElement;
    if (viewport) {
      viewport.style.transition = 'none';
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isViewportDragging) return;
      
      e.preventDefault();
      
      const deltaX = e.clientX - this.dragStartX;
      const thumbnailWidth = 192; // 200px - 8px padding
      
      // Calculate the available drag area (thumbnail width minus viewport width)
      const viewportWidth = this.thumbnailViewport.width;
      const availableDragWidth = thumbnailWidth - viewportWidth;
      
      // Calculate scroll ratio based on available drag area
      const scrollRatio = availableDragWidth > 0 ? this.maxScrollPosition / availableDragWidth : 0;
      const newScrollLeft = this.dragStartScrollLeft + (deltaX * scrollRatio);
      
      if (container) {
        const clampedScroll = Math.max(0, Math.min(this.maxScrollPosition, newScrollLeft));
        container.scrollLeft = clampedScroll;
        
        // Force immediate viewport update during drag
        requestAnimationFrame(() => {
          this.updateScrollPosition();
        });
      }
    };

    const handleMouseUp = () => {
      this.isViewportDragging = false;
      
      // Re-enable transitions
      if (viewport) {
        viewport.style.transition = 'all 0.1s ease';
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp); // Handle mouse leaving window
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

    // Disable transitions during drag for immediate response
    const viewport = document.querySelector('.thumbnail-viewport') as HTMLElement;
    if (viewport) {
      viewport.style.transition = 'none';
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!this.isViewportDragging) return;
      
      e.preventDefault();
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.dragStartX;
      const thumbnailWidth = 192; // 200px - 8px padding
      
      // Calculate the available drag area (thumbnail width minus viewport width)
      const viewportWidth = this.thumbnailViewport.width;
      const availableDragWidth = thumbnailWidth - viewportWidth;
      
      // Calculate scroll ratio based on available drag area
      const scrollRatio = availableDragWidth > 0 ? this.maxScrollPosition / availableDragWidth : 0;
      const newScrollLeft = this.dragStartScrollLeft + (deltaX * scrollRatio);
      
      if (container) {
        const clampedScroll = Math.max(0, Math.min(this.maxScrollPosition, newScrollLeft));
        container.scrollLeft = clampedScroll;
        
        // Force immediate viewport update during drag
        requestAnimationFrame(() => {
          this.updateScrollPosition();
        });
      }
    };

    const handleTouchEnd = () => {
      this.isViewportDragging = false;
      
      // Re-enable transitions
      if (viewport) {
        viewport.style.transition = 'all 0.1s ease';
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd); // Handle touch cancel
  }

  /**
   * Handles thumbnail touch events for navigation on touch devices.
   * Calculates scroll position based on touch location and smoothly scrolls to target position.
   * 
   * @param event - The touch event on the thumbnail
   */
  onThumbnailTouchStart(event: TouchEvent) {
    if (this.isDragging || this.isViewportDragging) return; // Don't handle touch if we were dragging
    
    event.stopPropagation();
    const thumbnail = event.currentTarget as HTMLElement;
    const thumbnailContent = thumbnail.querySelector('.thumbnail-content') as HTMLElement;
    const rect = thumbnailContent.getBoundingClientRect();
    const touch = event.touches[0];
    const clickX = touch.clientX - rect.left - 4; // Account for padding
    const thumbnailWidth = rect.width - 8; // Account for padding
    
    // Calculate the available click area (thumbnail width minus viewport width)
    const viewportWidth = this.thumbnailViewport.width;
    const availableClickWidth = thumbnailWidth - viewportWidth;
    
    // Adjust click position to account for viewport width
    const adjustedClickX = Math.max(0, Math.min(availableClickWidth, clickX - (viewportWidth / 2)));
    const percentage = availableClickWidth > 0 ? (adjustedClickX / availableClickWidth) * 100 : 0;
    
    const container = document.querySelector('.board-scroll-wrapper') as HTMLElement;
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
      
      // Check window width to determine if scrolling should be enabled
      const windowWidth = window.innerWidth;
      const shouldShowScroll = windowWidth >= 1000 && windowWidth <= 1750 && this.maxScrollPosition > 0;
      
      this.showScrollOverview = shouldShowScroll;
      
      if (this.maxScrollPosition > 0) {
        this.scrollPercentage = (this.scrollPosition / this.maxScrollPosition) * 100;
        this.thumbWidth = (container.clientWidth / boardContainer.scrollWidth) * 100;
        
        // Update thumbnail viewport with immediate response during dragging
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
    const thumbnailWidth = 192; // 200px - 8px padding
    const containerWidth = container.clientWidth;
    const scrollWidth = boardContainer.scrollWidth;
    
    // Calculate viewport size and position in thumbnail
    const viewportWidthRatio = containerWidth / scrollWidth;
    const viewportPositionRatio = this.maxScrollPosition > 0 ? this.scrollPosition / this.maxScrollPosition : 0;
    
    // Ensure proper bounds and positioning
    const viewportWidth = Math.min(thumbnailWidth, Math.max(20, viewportWidthRatio * thumbnailWidth));
    const viewportLeft = Math.max(0, Math.min(thumbnailWidth - viewportWidth, viewportPositionRatio * (thumbnailWidth - viewportWidth)));
    
    this.thumbnailViewport = {
      left: viewportLeft,
      width: viewportWidth,
      height: 96 // Full height minus header (120 - 24)
    };
  }

  /**
   * Sets up scroll event listeners and window resize handlers.
   * Initializes scroll position calculations with multiple attempts to ensure proper loading.
   */
  setupScrollListener() {
    const container = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (container) {
      // Use requestAnimationFrame for smooth scroll updates
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
      
      // Listen for window resize to update scroll calculations
      window.addEventListener('resize', () => {
        setTimeout(() => {
          this.updateScrollPosition();
        }, 100);
      });
      
      // Initial calculation with multiple attempts to ensure proper loading
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
    // Prevent the click from bubbling to thumbnail click handler
    event.stopPropagation();
    event.preventDefault();
  }
}

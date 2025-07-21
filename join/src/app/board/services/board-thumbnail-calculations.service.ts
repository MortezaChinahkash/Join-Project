import { Injectable } from '@angular/core';

/**
 * Service for calculation logic related to board thumbnails.
 * Handles scroll calculations, positioning, and viewport mathematics.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardThumbnailCalculationsService {

  /**
   * Calculates scroll percentage based on click position.
   */
  calculateClickScrollPercentage(clickData: { clickX: number; thumbnailWidth: number }, viewportWidth: number): number {
    const { clickX, thumbnailWidth } = clickData;
    const availableClickWidth = thumbnailWidth - viewportWidth;
    const adjustedClickX = Math.max(0, Math.min(availableClickWidth, clickX - (viewportWidth / 2)));
    
    return availableClickWidth > 0 ? (adjustedClickX / availableClickWidth) * 100 : 0;
  }

  /**
   * Calculates scroll percentage based on touch position.
   */
  calculateTouchScrollPercentage(touchData: { touchX: number; thumbnailWidth: number }, viewportWidth: number): number {
    const { touchX, thumbnailWidth } = touchData;
    const availableClickWidth = thumbnailWidth - viewportWidth;
    const adjustedTouchX = Math.max(0, Math.min(availableClickWidth, touchX - (viewportWidth / 2)));
    
    return availableClickWidth > 0 ? (adjustedTouchX / availableClickWidth) * 100 : 0;
  }

  /**
   * Calculates new scroll position based on drag delta.
   */
  calculateNewScrollPosition(deltaX: number, viewportWidth: number, maxScrollPosition: number, dragStartScrollLeft: number): number {
    const thumbnailWidth = 192;
    const availableDragWidth = thumbnailWidth - viewportWidth;
    const scrollRatio = availableDragWidth > 0 ? maxScrollPosition / availableDragWidth : 0;
    const newScrollLeft = dragStartScrollLeft + (deltaX * scrollRatio);
    
    return Math.max(0, Math.min(maxScrollPosition, newScrollLeft));
  }

  /**
   * Updates basic scroll position values.
   */
  updateScrollValues(container: HTMLElement, boardContainer: HTMLElement): { scrollPosition: number; maxScrollPosition: number } {
    const scrollPosition = container.scrollLeft;
    const maxScrollPosition = boardContainer.scrollWidth - container.clientWidth;
    return { scrollPosition, maxScrollPosition };
  }

  /**
   * Determines if scroll overview should be visible.
   */
  determineScrollOverviewVisibility(maxScrollPosition: number): boolean {
    const windowWidth = window.innerWidth;
    return windowWidth >= 1000 && windowWidth <= 1750 && maxScrollPosition > 0;
  }

  /**
   * Calculates scroll metrics when scrolling is active.
   */
  calculateActiveScrollMetrics(container: HTMLElement, boardContainer: HTMLElement, scrollPosition: number, maxScrollPosition: number): { scrollPercentage: number; thumbWidth: number } {
    const scrollPercentage = (scrollPosition / maxScrollPosition) * 100;
    const thumbWidth = (container.clientWidth / boardContainer.scrollWidth) * 100;
    return { scrollPercentage, thumbWidth };
  }

  /**
   * Updates the thumbnail viewport position and size based on current scroll state.
   */
  updateThumbnailViewport(container: HTMLElement, boardContainer: HTMLElement, scrollPosition: number, maxScrollPosition: number): { left: number; width: number; height: number } {
    const thumbnailWidth = 192;
    const containerWidth = container.clientWidth;
    const scrollWidth = boardContainer.scrollWidth;
    const viewportWidthRatio = containerWidth / scrollWidth;
    const viewportPositionRatio = maxScrollPosition > 0 ? scrollPosition / maxScrollPosition : 0;
    const viewportWidth = Math.min(thumbnailWidth, Math.max(20, viewportWidthRatio * thumbnailWidth));
    const viewportLeft = Math.max(0, Math.min(thumbnailWidth - viewportWidth, viewportPositionRatio * (thumbnailWidth - viewportWidth)));
    
    return {
      left: viewportLeft,
      width: viewportWidth,
      height: 96
    };
  }

  /**
   * Converts percentage to scroll position.
   */
  percentageToScrollPosition(percentage: number, maxScrollPosition: number): number {
    return (percentage / 100) * maxScrollPosition;
  }
}

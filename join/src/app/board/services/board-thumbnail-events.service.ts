import { Injectable } from '@angular/core';
import { BoardThumbnailDomService } from './board-thumbnail-dom.service';
import { BoardThumbnailCalculationsService } from './board-thumbnail-calculations.service';

/**
 * Service for handling board thumbnail events and interactions.
 * Manages click, touch, and drag events for thumbnail navigation.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardThumbnailEventsService {
  private isViewportDragging = false;
  private dragStartX = 0;
  private dragStartScrollLeft = 0;

  constructor(
    private domService: BoardThumbnailDomService,
    private calculationsService: BoardThumbnailCalculationsService
  ) {}

  /**
   * Checks if thumbnail click should be ignored.
   */
  shouldIgnoreThumbnailClick(isDragging: boolean, isViewportDragging: boolean): boolean {
    return isDragging || isViewportDragging;
  }

  /**
   * Checks if thumbnail touch should be ignored.
   */
  shouldIgnoreThumbnailTouch(isDragging: boolean, isViewportDragging: boolean): boolean {
    return isDragging || isViewportDragging;
  }

  /**
   * Handles thumbnail click navigation.
   */
  handleThumbnailClick(event: MouseEvent, viewportWidth: number, maxScrollPosition: number): void {
    event.stopPropagation();
    const clickData = this.domService.extractClickData(event);
    const scrollPercentage = this.calculationsService.calculateClickScrollPercentage(clickData, viewportWidth);
    const scrollPosition = this.calculationsService.percentageToScrollPosition(scrollPercentage, maxScrollPosition);
    this.domService.scrollToPosition(scrollPosition);
  }

  /**
   * Handles thumbnail touch navigation.
   */
  handleThumbnailTouch(event: TouchEvent, viewportWidth: number, maxScrollPosition: number): void {
    event.stopPropagation();
    const touchData = this.domService.extractTouchData(event);
    const scrollPercentage = this.calculationsService.calculateTouchScrollPercentage(touchData, viewportWidth);
    const scrollPosition = this.calculationsService.percentageToScrollPosition(scrollPercentage, maxScrollPosition);
    this.domService.scrollToPosition(scrollPosition);
  }

  /**
   * Initializes viewport dragging state and DOM elements.
   */
  initializeViewportDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isViewportDragging = true;
    this.dragStartX = event.clientX;
    
    const container = this.domService.getBoardScrollWrapper();
    if (container) {
      this.dragStartScrollLeft = container.scrollLeft;
    }
    
    this.domService.disableViewportTransition();
  }

  /**
   * Initializes viewport touch dragging state and DOM elements.
   */
  initializeViewportTouchDrag(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isViewportDragging = true;
    const touch = event.touches[0];
    this.dragStartX = touch.clientX;
    
    const container = this.domService.getBoardScrollWrapper();
    if (container) {
      this.dragStartScrollLeft = container.scrollLeft;
    }
    
    this.domService.disableViewportTransition();
  }

  /**
   * Creates mouse move handler for viewport dragging.
   */
  createMouseMoveHandler(viewportWidth: number, maxScrollPosition: number, updateCallback: () => void): (e: MouseEvent) => void {
    return (e: MouseEvent) => {
      if (!this.isViewportDragging) return;
      e.preventDefault();
      
      const deltaX = e.clientX - this.dragStartX;
      const scrollPosition = this.calculationsService.calculateNewScrollPosition(deltaX, viewportWidth, maxScrollPosition, this.dragStartScrollLeft);
      this.domService.updateContainerScroll(scrollPosition, updateCallback);
    };
  }

  /**
   * Creates touch move handler for viewport dragging.
   */
  createTouchMoveHandler(viewportWidth: number, maxScrollPosition: number, updateCallback: () => void): (e: TouchEvent) => void {
    return (e: TouchEvent) => {
      if (!this.isViewportDragging) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.dragStartX;
      const scrollPosition = this.calculationsService.calculateNewScrollPosition(deltaX, viewportWidth, maxScrollPosition, this.dragStartScrollLeft);
      this.domService.updateContainerScroll(scrollPosition, updateCallback);
    };
  }

  /**
   * Creates mouse up handler for ending viewport drag.
   */
  createMouseUpHandler(handleMouseMove: (e: MouseEvent) => void): () => void {
    return () => {
      this.finalizeDragOperation();
      this.removeMouseEventListeners(handleMouseMove);
    };
  }

  /**
   * Creates touch end handler for ending viewport drag.
   */
  createTouchEndHandler(handleTouchMove: (e: TouchEvent) => void): () => void {
    return () => {
      this.finalizeDragOperation();
      this.removeTouchEventListeners(handleTouchMove);
    };
  }

  /**
   * Sets up mouse event listeners for viewport dragging.
   */
  setupMouseEventListeners(handleMouseMove: (e: MouseEvent) => void, handleMouseUp: () => void): void {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
  }

  /**
   * Sets up touch event listeners for viewport dragging.
   */
  setupTouchEventListeners(handleTouchMove: (e: TouchEvent) => void, handleTouchEnd: () => void): void {
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  }

  /**
   * Finalizes drag operation and restores viewport transition.
   */
  private finalizeDragOperation(): void {
    this.isViewportDragging = false;
    this.domService.enableViewportTransition();
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
   * Removes touch event listeners.
   */
  private removeTouchEventListeners(handleTouchMove: (e: TouchEvent) => void): void {
    const handleTouchEnd = () => {
      this.finalizeDragOperation();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
    
    handleTouchEnd();
  }

  /**
   * Gets the current viewport dragging state.
   */
  getIsViewportDragging(): boolean {
    return this.isViewportDragging;
  }

  /**
   * Resets drag state.
   */
  resetDragState(): void {
    this.isViewportDragging = false;
    this.dragStartX = 0;
    this.dragStartScrollLeft = 0;
  }
}

import { Injectable } from '@angular/core';
import { BoardThumbnailDomService } from './board-thumbnail-dom.service';
import { BoardThumbnailCalculationsService } from './board-thumbnail-calculations.service';
import { BoardThumbnailEventsService } from './board-thumbnail-events.service';

/**
 * Main service for handling board thumbnail navigation and scroll functionality.
 * Coordinates between DOM, calculations, and events services.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
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

  constructor(
    private domService: BoardThumbnailDomService,
    private calculationsService: BoardThumbnailCalculationsService,
    private eventsService: BoardThumbnailEventsService
  ) {}

  /**
   * Handles thumbnail click events for navigation.
   */
  onThumbnailClick(event: MouseEvent) {
    if (this.eventsService.shouldIgnoreThumbnailClick(this.isDragging, this.eventsService.getIsViewportDragging())) return;
    this.eventsService.handleThumbnailClick(event, this.thumbnailViewport.width, this.maxScrollPosition);
  }

  /**
   * Handles viewport drag start for thumbnail navigation.
   */
  onViewportMouseDown(event: MouseEvent) {
    this.eventsService.initializeViewportDrag(event);
    const handleMouseMove = this.eventsService.createMouseMoveHandler(
      this.thumbnailViewport.width, 
      this.maxScrollPosition, 
      () => this.updateScrollPosition()
    );
    const handleMouseUp = this.eventsService.createMouseUpHandler(handleMouseMove);
    this.eventsService.setupMouseEventListeners(handleMouseMove, handleMouseUp);
  }

  /**
   * Handles viewport touch start for thumbnail navigation on touch devices.
   */
  onViewportTouchStart(event: TouchEvent) {
    this.eventsService.initializeViewportTouchDrag(event);
    const handleTouchMove = this.eventsService.createTouchMoveHandler(
      this.thumbnailViewport.width, 
      this.maxScrollPosition, 
      () => this.updateScrollPosition()
    );
    const handleTouchEnd = this.eventsService.createTouchEndHandler(handleTouchMove);
    this.eventsService.setupTouchEventListeners(handleTouchMove, handleTouchEnd);
  }

  /**
   * Handles thumbnail touch events for navigation on touch devices.
   */
  onThumbnailTouchStart(event: TouchEvent) {
    if (this.eventsService.shouldIgnoreThumbnailTouch(this.isDragging, this.eventsService.getIsViewportDragging())) return;
    this.eventsService.handleThumbnailTouch(event, this.thumbnailViewport.width, this.maxScrollPosition);
  }

  /**
   * Updates scroll position and thumbnail viewport calculations.
   */
  updateScrollPosition() {
    const containers = this.domService.getScrollContainers();
    if (!containers.container || !containers.boardContainer) return;
    
    const scrollValues = this.calculationsService.updateScrollValues(containers.container, containers.boardContainer);
    this.scrollPosition = scrollValues.scrollPosition;
    this.maxScrollPosition = scrollValues.maxScrollPosition;
    
    this.showScrollOverview = this.calculationsService.determineScrollOverviewVisibility(this.maxScrollPosition);
    
    if (this.maxScrollPosition > 0) {
      const metrics = this.calculationsService.calculateActiveScrollMetrics(
        containers.container, 
        containers.boardContainer, 
        this.scrollPosition, 
        this.maxScrollPosition
      );
      this.scrollPercentage = metrics.scrollPercentage;
      this.thumbWidth = metrics.thumbWidth;
      
      this.thumbnailViewport = this.calculationsService.updateThumbnailViewport(
        containers.container, 
        containers.boardContainer, 
        this.scrollPosition, 
        this.maxScrollPosition
      );
    } else {
      this.scrollPercentage = 0;
      this.thumbWidth = 100;
    }
  }

  /**
   * Sets up scroll event listeners and window resize handlers.
   */
  setupScrollListener() {
    const container = this.domService.getBoardScrollWrapper();
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
      
      // Initialize with multiple attempts
      setTimeout(() => this.updateScrollPosition(), 100);
      setTimeout(() => this.updateScrollPosition(), 500);
      setTimeout(() => this.updateScrollPosition(), 1000);
    }
  }

  /**
   * Resets all thumbnail and scroll state variables.
   */
  resetThumbnailState() {
    this.isDragging = false;
    this.eventsService.resetDragState();
    this.scrollPosition = 0;
    this.maxScrollPosition = 0;
    this.scrollPercentage = 0;
    this.thumbWidth = 100;
    this.showScrollOverview = false;
  }

  /**
   * Handles viewport click events.
   */
  onViewportClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
  }
}

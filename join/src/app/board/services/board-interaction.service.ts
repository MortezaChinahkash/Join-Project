import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { BoardDragDropService } from './board-drag-drop.service';
import { BoardThumbnailService } from './board-thumbnail.service';

/**
 * Service responsible for handling user interactions in the board component.
 * Manages event handlers for drag & drop, touch events, and thumbnail navigation.
 */
/**
 * Service for handling user interaction events on the board.
 * Manages mouse and touch events, drag operations, and viewport interactions.
 * 
 * This service provides methods for:
 * - Task mouse down and touch start event handling
 * - Column drag and drop event management
 * - Thumbnail click and touch navigation
 * - Viewport interaction events for overlay management
 * - Event delegation and coordination between different interaction types
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 * @since 2024
 */
@Injectable({
  providedIn: 'root'
})
export class BoardInteractionService {

  constructor(
    private dragDropService: BoardDragDropService,
    private thumbnailService: BoardThumbnailService
  ) {}

  /**
   * Handles mouse down on task for drag operation or details opening.
   * @param event - Mouse event
   * @param task - Task being interacted with
   * @param updateCallback - Callback to update task arrays
   * @returns Promise indicating if task was dragged
   */
  async handleTaskMouseDown(
    event: MouseEvent, 
    task: Task, 
    updateCallback: () => void
  ): Promise<boolean> {
    return await this.dragDropService.onTaskMouseDown(event, task, updateCallback);
  }

  /**
   * Handles touch start on task for drag operation or details opening.
   * @param event - Touch event
   * @param task - Task being interacted with
   * @param updateCallback - Callback to update task arrays
   * @returns Promise indicating if task was dragged
   */
  async handleTaskTouchStart(
    event: TouchEvent, 
    task: Task, 
    updateCallback: () => void
  ): Promise<boolean> {
    return await this.dragDropService.onTaskTouchStart(event, task, updateCallback);
  }

  /**
   * Handles drag over event on columns.
   * @param event - Drag event
   * @param column - Target column
   */
  handleColumnDragOver(event: DragEvent, column: TaskColumn): void {
    this.dragDropService.onColumnDragOver(event, column);
  }

  /**
   * Handles drag leave event on columns.
   * @param event - Drag event
   */
  handleColumnDragLeave(event: DragEvent): void {
    this.dragDropService.onColumnDragLeave(event);
  }

  /**
   * Handles drop event on columns.
   * @param event - Drag event
   * @param column - Target column
   */
  handleColumnDrop(event: DragEvent, column: TaskColumn): void {
    this.dragDropService.onColumnDrop(event, column);
  }

  /**
   * Handles thumbnail click events.
   * @param event - Mouse event
   */
  handleThumbnailClick(event: MouseEvent): void {
    this.thumbnailService.onThumbnailClick(event);
  }

  /**
   * Handles thumbnail touch start events for touch devices.
   * @param event - Touch event
   */
  handleThumbnailTouchStart(event: TouchEvent): void {
    this.thumbnailService.onThumbnailTouchStart(event);
  }

  /**
   * Handles viewport mouse down events.
   * @param event - Mouse event
   */
  handleViewportMouseDown(event: MouseEvent): void {
    this.thumbnailService.onViewportMouseDown(event);
  }

  /**
   * Handles viewport touch start events for touch devices.
   * @param event - Touch event
   */
  handleViewportTouchStart(event: TouchEvent): void {
    this.thumbnailService.onViewportTouchStart(event);
  }

  /**
   * Handles viewport click events.
   * @param event - Mouse event
   */
  handleViewportClick(event: MouseEvent): void {
    this.thumbnailService.onViewportClick(event);
  }

  /**
   * Sets up the scroll listener for thumbnail navigation.
   */
  setupScrollListener(): void {
    setTimeout(() => {
      this.thumbnailService.setupScrollListener();
    }, 500);
  }
}





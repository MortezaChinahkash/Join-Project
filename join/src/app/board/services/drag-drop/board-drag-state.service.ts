import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../../interfaces/task.interface';
/**
 * Service for managing drag and drop state variables and properties.
 * Centralizes all drag-related state management for the board component.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragStateService {
  // Task drag and drop properties
  draggedTask: Task | null = null;
  dragStartPosition = { x: 0, y: 0 };
  isDraggingTask = false;
  dragOverColumn: TaskColumn | null = null;
  dragPlaceholderVisible = false;
  dragPlaceholderHeight = 0;
  touchStartTime = 0;
  longPressTimeout: any = null;
  dragOffset = { x: 0, y: 0 };
  dragElement: HTMLElement | null = null;
  // Click detection properties
  isMousePressed = false;
  mouseDownTime = 0;
  dragThreshold = 5; // pixels to move before considering it a drag
  dragDelay = 150; // milliseconds before drag starts
  dragDelayTimeout: any = null;
  initialMousePosition = { x: 0, y: 0 };
  // Auto-scroll properties
  autoScrollZone = 200; // pixels from top/bottom where auto-scroll activates
  autoScrollSpeed = 8; // pixels per scroll step
  autoScrollInterval: any = null;
  isAutoScrolling = false;
  currentCursorY = 0; // Track current cursor position for auto-scroll
  /**
   * Resets all drag & drop state variables to their initial values.
   * Useful for cleanup when component is destroyed or when resetting the board state.
   */
  resetDragState(): void {
    this.isDraggingTask = false;
    this.draggedTask = null;
    this.dragOverColumn = null;
    this.dragPlaceholderVisible = false;
    this.dragPlaceholderHeight = 0;
    this.currentCursorY = 0;
    this.isMousePressed = false;
    this.mouseDownTime = 0;
    this.initialMousePosition = { x: 0, y: 0 };
    // Clear timeouts
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    if (this.dragDelayTimeout) {
      clearTimeout(this.dragDelayTimeout);
      this.dragDelayTimeout = null;
    }
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
    // Remove drag element from DOM
    if (this.dragElement) {
      document.body.removeChild(this.dragElement);
      this.dragElement = null;
    }
    this.isAutoScrolling = false;
  }
  /**
   * Sets the drag element position based on cursor coordinates.
   * 
   * @param clientX - X coordinate of cursor/touch
   * @param clientY - Y coordinate of cursor/touch
   */
  updateDragElementPosition(clientX: number, clientY: number): void {
    if (!this.dragElement) return;
    this.dragElement.style.left = (clientX - this.dragOffset.x) + 'px';
    this.dragElement.style.top = (clientY - this.dragOffset.y) + 'px';
    this.currentCursorY = clientY;
  }
  /**
   * Updates drag over column and placeholder visibility.
   * 
   * @param column - The column being dragged over
   */
  updateDragOverColumn(column: TaskColumn | null): void {
    if (column && column !== this.draggedTask?.column) {
      this.dragOverColumn = column;
      this.dragPlaceholderVisible = true;
    } else {
      this.dragOverColumn = null;
      this.dragPlaceholderVisible = false;
    }
  }
  /**
   * Checks if a drag operation is currently active.
   * 
   * @returns True if dragging is in progress
   */
  isDragActive(): boolean {
    return this.isDraggingTask && this.draggedTask !== null;
  }
}

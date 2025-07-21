import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
/**
 * Service for managing drag and drop state in the board component.
 * Handles all drag-related state properties and status tracking.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })

export class BoardDragStateService {
  draggedTask: Task | null = null;
  dragStartPosition = { x: 0, y: 0 };
  isDraggingTask = false;
  dragOverColumn: TaskColumn | null = null;
  dragPlaceholderVisible = false;
  dragPlaceholderHeight = 0;
  dragOffset = { x: 0, y: 0 };
  dragElement: HTMLElement | null = null;
  isMousePressed = false;
  mouseDownTime = 0;
  dragThreshold = 5;
  dragDelay = 150;
  dragDelayTimeout: any = null;
  initialMousePosition = { x: 0, y: 0 };
  touchStartTime = 0;
  longPressTimeout: any = null;
  private boardScrollWrapper: HTMLElement | null = null;
  private originalOverflowX: string = '';
  /**
   * Resets all drag state to initial values.
   */
  resetDragState(): void {
    this.draggedTask = null;
    this.isDraggingTask = false;
    this.dragOverColumn = null;
    this.dragPlaceholderVisible = false;
    this.dragPlaceholderHeight = 0;
    this.dragElement = null;
    this.isMousePressed = false;
    this.clearTimeouts();
    this.restoreBoardScrollWrapper();
  }
  
  /**
   * Sets board scroll wrapper overflow to visible during drag.
   */
  setBoardScrollWrapperForDrag(): void {
    this.boardScrollWrapper = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (this.boardScrollWrapper) {
      this.originalOverflowX = window.getComputedStyle(this.boardScrollWrapper).overflowX;
      this.boardScrollWrapper.style.overflowX = 'visible';
    }
  }
  
  /**
   * Restores board scroll wrapper overflow to original state.
   */
  restoreBoardScrollWrapper(): void {
    if (this.boardScrollWrapper && this.originalOverflowX) {
      this.boardScrollWrapper.style.overflowX = this.originalOverflowX;
      this.boardScrollWrapper = null;
      this.originalOverflowX = '';
    }
  }
  
  /**
   * Emergency cleanup method to ensure board scroll wrapper is restored.
   * Should be called on window blur, escape key, etc.
   */
  emergencyCleanup(): void {
    if (this.isDraggingTask) {
      this.resetDragState();
    }
  }

  /**
   * Clears all active timeouts.
   */
  clearTimeouts(): void {
    if (this.dragDelayTimeout) {
      clearTimeout(this.dragDelayTimeout);
      this.dragDelayTimeout = null;
    }
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  /**
   * Sets the dragged task and initial position.
   * 
   * @param task - Task being dragged
   * @param x - Initial X position
   * @param y - Initial Y position
   */
  startDrag(task: Task, x: number, y: number): void {
    this.draggedTask = task;
    this.isDraggingTask = true;
    this.dragStartPosition = { x, y };
    this.setBoardScrollWrapperForDrag();
  }

  /**
   * Updates drag position.
   * 
   * @param x - Current X position
   * @param y - Current Y position
   */
  updateDragPosition(x: number, y: number): void {
    if (this.dragElement) {
      this.dragElement.style.left = `${x - this.dragOffset.x}px`;
      this.dragElement.style.top = `${y - this.dragOffset.y}px`;
    }
  }

  /**
   * Sets the drag element and calculates offset.
   * 
   * @param element - HTML element being dragged
   * @param mouseX - Mouse X position
   * @param mouseY - Mouse Y position
   */
  setDragElement(element: HTMLElement, mouseX: number, mouseY: number): void {
    this.dragElement = element;
    const rect = element.getBoundingClientRect();
    this.dragOffset = {
      x: mouseX - rect.left,
      y: mouseY - rect.top
    };
  }

  /**
   * Sets the drag element with pre-calculated offset.
   * 
   * @param element - HTML element being dragged
   * @param offsetX - Pre-calculated X offset
   * @param offsetY - Pre-calculated Y offset
   */
  setDragElementWithOffset(element: HTMLElement, offsetX: number, offsetY: number): void {
    this.dragElement = element;
    this.dragOffset = {
      x: offsetX,
      y: offsetY
    };
  }

  /**
   * Checks if movement exceeds drag threshold.
   * 
   * @param currentX - Current X position
   * @param currentY - Current Y position
   * @returns True if threshold exceeded
   */
  exceedsDragThreshold(currentX: number, currentY: number): boolean {
    const deltaX = Math.abs(currentX - this.initialMousePosition.x);
    const deltaY = Math.abs(currentY - this.initialMousePosition.y);
    return deltaX > this.dragThreshold || deltaY > this.dragThreshold;
  }

  /**
   * Sets mouse press state and initial position.
   * 
   * @param x - Initial X position
   * @param y - Initial Y position
   */
  setMousePressed(x: number, y: number): void {
    this.isMousePressed = true;
    this.mouseDownTime = Date.now();
    this.initialMousePosition = { x, y };
  }

  /**
   * Checks if drag delay has elapsed.
   * 
   * @returns True if enough time has passed
   */
  dragDelayElapsed(): boolean {
    return Date.now() - this.mouseDownTime >= this.dragDelay;
  }

  /**
   * Sets drag over column for visual feedback.
   * 
   * @param column - Column being dragged over
   */
  setDragOverColumn(column: TaskColumn | null): void {
    this.dragOverColumn = column;
  }

  /**
   * Sets placeholder visibility and height.
   * 
   * @param visible - Whether placeholder is visible
   * @param height - Height of placeholder
   */
  setPlaceholder(visible: boolean, height: number = 0): void {
    this.dragPlaceholderVisible = visible;
    this.dragPlaceholderHeight = height;
  }
}

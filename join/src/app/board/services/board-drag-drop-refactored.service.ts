import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardThumbnailService } from './board-thumbnail.service';
import { BoardDragStateService } from './drag-drop/board-drag-state.service';
import { BoardDragAutoScrollService } from './drag-drop/board-drag-auto-scroll.service';
import { BoardDragDetectionService } from './drag-drop/board-drag-detection.service';
/**
 * Refactored main service for handling drag & drop functionality in the board component.
 * Orchestrates the drag and drop operations using specialized sub-services.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragDropService {
  constructor(
    private taskService: TaskService,
    private boardThumbnailService: BoardThumbnailService,
    private dragState: BoardDragStateService,
    private autoScroll: BoardDragAutoScrollService,
    private dragDetection: BoardDragDetectionService
  ) {}
  // Expose state properties through getters for backward compatibility
  get draggedTask() { return this.dragState.draggedTask; }
  get isDraggingTask() { return this.dragState.isDraggingTask; }
  get dragOverColumn() { return this.dragState.dragOverColumn; }
  get dragPlaceholderVisible() { return this.dragState.dragPlaceholderVisible; }
  get dragPlaceholderHeight() { return this.dragState.dragPlaceholderHeight; }
  /**
   * Handles mouse down events on tasks for desktop drag & drop functionality.
   * Initiates task dragging with left mouse button click and sets up mouse event listeners.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a click
   */
  onTaskMouseDown(event: MouseEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      // Only handle left mouse button
      if (event.button !== 0) {
        resolve(false);
        return;
      }
      this.dragState.isMousePressed = true;
      this.dragState.mouseDownTime = Date.now();
      this.dragState.initialMousePosition = { x: event.clientX, y: event.clientY };
      let hasMoved = false;
      let dragStarted = false;
      // Start delay timer for drag
      this.dragState.dragDelayTimeout = setTimeout(() => {
        if (this.dragState.isMousePressed && !hasMoved) {
          this.startTaskDrag(event.clientX, event.clientY, task, event.target as HTMLElement);
          dragStarted = true;
        }
      }, this.dragState.dragDelay);
      const handleMouseMove = (e: MouseEvent) => {
        if (!this.dragState.isMousePressed) return;
        const deltaX = Math.abs(e.clientX - this.dragState.initialMousePosition.x);
        const deltaY = Math.abs(e.clientY - this.dragState.initialMousePosition.y);
        if (deltaX > this.dragState.dragThreshold || deltaY > this.dragState.dragThreshold) {
          hasMoved = true;
          // Start drag immediately if threshold is exceeded
          if (!dragStarted && !this.dragState.isDraggingTask) {
            if (this.dragState.dragDelayTimeout) {
              clearTimeout(this.dragState.dragDelayTimeout);
              this.dragState.dragDelayTimeout = null;
            }
            this.startTaskDrag(e.clientX, e.clientY, task, event.target as HTMLElement);
            dragStarted = true;
          }
        }
        if (this.dragState.isDraggingTask) {
          e.preventDefault();
          this.updateTaskDrag(e.clientX, e.clientY);
        }
      };
      const handleMouseUp = () => {
        this.dragState.isMousePressed = false;
        if (this.dragState.dragDelayTimeout) {
          clearTimeout(this.dragState.dragDelayTimeout);
          this.dragState.dragDelayTimeout = null;
        }
        if (this.dragState.isDraggingTask) {
          this.endTaskDrag(onTaskUpdate);
          resolve(true); // Was a drag
        } else {
          resolve(false); // Was a click
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }
  /**
   * Handles touch start events on tasks for mobile drag & drop functionality.
   * Uses long press to initiate dragging on touch devices.
   * 
   * @param event - The touch event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a tap
   */
  onTaskTouchStart(event: TouchEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      event.preventDefault();
      const touch = event.touches[0];
      let dragStarted = false;
      // Start long press timer for mobile
      this.dragState.longPressTimeout = setTimeout(() => {
        this.startTaskDrag(touch.clientX, touch.clientY, task, event.target as HTMLElement);
        dragStarted = true;
      }, 500); // 500ms long press
      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (this.dragState.isDraggingTask) {
          e.preventDefault();
          this.autoScroll.emergencyAutoScroll(e);
          this.updateTaskDrag(touch.clientX, touch.clientY);
        } else {
          // Cancel long press if user moves finger before drag starts
          if (this.dragState.longPressTimeout) {
            clearTimeout(this.dragState.longPressTimeout);
            this.dragState.longPressTimeout = null;
          }
        }
      };
      const handleTouchEnd = () => {
        if (this.dragState.longPressTimeout) {
          clearTimeout(this.dragState.longPressTimeout);
          this.dragState.longPressTimeout = null;
        }
        if (this.dragState.isDraggingTask) {
          this.endTaskDrag(onTaskUpdate);
          resolve(true); // Was a drag
        } else {
          resolve(false); // Was a tap
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    });
  }
  /**
   * Initiates the task dragging process by creating a visual clone and setting up drag state.
   * 
   * @param clientX - The X coordinate of the mouse/touch position
   * @param clientY - The Y coordinate of the mouse/touch position  
   * @param task - The task object being dragged
   * @param element - The HTML element that triggered the drag
   * @private
   */
  private startTaskDrag(clientX: number, clientY: number, task: Task, element: HTMLElement): void {
    this.dragState.draggedTask = task;
    this.dragState.isDraggingTask = true;
    this.dragState.dragStartPosition = { x: clientX, y: clientY };
    // Enable overflow-x: visible for drag operations
    this.enableDragOverflow();
    // Find the task card element
    const taskCard = element.closest('.task-card') as HTMLElement;
    if (taskCard) {
      // Clone the element for dragging
      this.dragState.dragElement = taskCard.cloneNode(true) as HTMLElement;
      this.dragState.dragElement.style.position = 'fixed';
      this.dragState.dragElement.style.pointerEvents = 'none';
      this.dragState.dragElement.style.zIndex = '9999';
      this.dragState.dragElement.style.transform = 'rotate(5deg)';
      this.dragState.dragElement.style.transition = 'none';
      this.dragState.dragElement.style.width = taskCard.offsetWidth + 'px';
      this.dragState.dragElement.style.height = taskCard.offsetHeight + 'px';
      this.dragState.dragElement.classList.add('task-dragging');
      // Calculate offset from mouse/touch to element
      const rect = taskCard.getBoundingClientRect();
      this.dragState.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      // Position the drag element
      this.dragState.updateDragElementPosition(clientX, clientY);
      document.body.appendChild(this.dragState.dragElement);
      // Add dragging class to original element
      taskCard.classList.add('task-dragging-original');
      // Store placeholder height
      this.dragState.dragPlaceholderHeight = taskCard.offsetHeight;
    }
  }
  /**
   * Updates the position of the dragged task element and determines target column.
   * 
   * @param clientX - The current X coordinate of the mouse/touch position
   * @param clientY - The current Y coordinate of the mouse/touch position
   * @private
   */
  private updateTaskDrag(clientX: number, clientY: number): void {
    if (!this.dragState.isDraggingTask || !this.dragState.dragElement) return;
    // Handle auto-scrolling
    this.autoScroll.handleAutoScroll(clientY);
    // Update drag element position
    this.dragState.updateDragElementPosition(clientX, clientY);
    // Detect target column
    const targetColumn = this.dragDetection.getColumnAtPosition(clientX, clientY);
    // Update drag over column and show/hide placeholder
    this.dragState.updateDragOverColumn(targetColumn);
  }
  /**
   * Handles drag over events on board columns to show visual feedback.
   * 
   * @param event - The drag event from the column
   * @param column - The target column being dragged over
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    if (this.dragState.isDraggingTask && this.dragState.draggedTask && column !== this.dragState.draggedTask.column) {
      event.preventDefault();
      this.dragState.updateDragOverColumn(column);
    }
  }
  /**
   * Handles drag leave events on board columns to hide placeholder.
   * 
   * @param event - The drag leave event from the column
   */
  onColumnDragLeave(event: DragEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      this.dragState.updateDragOverColumn(null);
    }
  }
  /**
   * Handles drop events on board columns.
   * 
   * @param event - The drop event from the column
   * @param column - The target column where the task is being dropped
   */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
    // The actual drop logic is handled in endTaskDrag()
  }
  /**
   * Ends the task drag operation and updates task position if dropped on valid target.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @private
   */
  private endTaskDrag(onTaskUpdate: () => void): void {
    if (!this.dragState.draggedTask) return;
    // Move task to new column if dropped on different column
    if (this.dragState.dragOverColumn && this.dragState.dragOverColumn !== this.dragState.draggedTask.column) {
      this.dragState.draggedTask.column = this.dragState.dragOverColumn;
      this.taskService.updateTask(this.dragState.draggedTask.id!, this.dragState.draggedTask);
      onTaskUpdate();
    }
    // Clean up drag state
    this.cleanup();
  }
  /**
   * Resets all drag & drop state variables.
   */
  resetDragState(): void {
    this.dragState.resetDragState();
    this.autoScroll.stopAutoScroll();
    this.disableDragOverflow();
  }
  /**
   * Cleans up drag operation and resets state.
   * @private
   */
  private cleanup(): void {
    // Remove drag element
    if (this.dragState.dragElement) {
      document.body.removeChild(this.dragState.dragElement);
    }
    // Remove dragging classes
    const draggingElements = document.querySelectorAll('.task-dragging-original');
    draggingElements.forEach(el => el.classList.remove('task-dragging-original'));
    // Reset state
    this.resetDragState();
  }
  /**
   * Enables drag overflow for the main content area.
   * @private
   */
  private enableDragOverflow(): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.overflowX = 'visible';
    }
  }
  /**
   * Disables drag overflow for the main content area.
   * @private
   */
  private disableDragOverflow(): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.overflowX = 'auto';
    }
  }
}

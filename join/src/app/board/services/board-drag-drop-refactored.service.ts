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
      if (event.button !== 0) {
        resolve(false);
        return;
      }
      
      const dragContext = this.initializeMouseDragState(event, task);
      const handleMouseMove = this.createMouseMoveHandler(event, task, dragContext);
      const handleMouseUp = this.createMouseUpHandler(onTaskUpdate, resolve, handleMouseMove);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  /**
   * Initializes the mouse drag state and sets up the delay timeout.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @returns Object containing drag context variables
   * @private
   */
  private initializeMouseDragState(event: MouseEvent, task: Task): { hasMoved: boolean; dragStarted: boolean } {
    this.dragState.isMousePressed = true;
    this.dragState.mouseDownTime = Date.now();
    this.dragState.initialMousePosition = { x: event.clientX, y: event.clientY };
    const dragContext = { hasMoved: false, dragStarted: false };
    
    this.dragState.dragDelayTimeout = setTimeout(() => {
      if (this.dragState.isMousePressed && !dragContext.hasMoved) {
        this.startTaskDrag(event.clientX, event.clientY, task, event.target as HTMLElement);
        dragContext.dragStarted = true;
      }
    }, this.dragState.dragDelay);
    
    return dragContext;
  }

  /**
   * Creates the mouse move event handler for drag operations.
   * 
   * @param event - The original mouse event
   * @param task - The task object being dragged
   * @param dragContext - The drag context containing movement state
   * @returns Mouse move event handler function
   * @private
   */
  private createMouseMoveHandler(event: MouseEvent, task: Task, dragContext: { hasMoved: boolean; dragStarted: boolean }): (e: MouseEvent) => void {
    return (e: MouseEvent) => {
      if (!this.dragState.isMousePressed) return;
      
      const deltaX = Math.abs(e.clientX - this.dragState.initialMousePosition.x);
      const deltaY = Math.abs(e.clientY - this.dragState.initialMousePosition.y);
      
      if (deltaX > this.dragState.dragThreshold || deltaY > this.dragState.dragThreshold) {
        this.handleMouseMovementThreshold(e, task, event, dragContext);
      }
      
      if (this.dragState.isDraggingTask) {
        e.preventDefault();
        this.updateTaskDrag(e.clientX, e.clientY);
      }
    };
  }

  /**
   * Handles mouse movement that exceeds the drag threshold.
   * 
   * @param e - The current mouse event
   * @param task - The task object being dragged
   * @param originalEvent - The original mouse down event
   * @param dragContext - The drag context containing movement state
   * @private
   */
  private handleMouseMovementThreshold(e: MouseEvent, task: Task, originalEvent: MouseEvent, dragContext: { hasMoved: boolean; dragStarted: boolean }): void {
    dragContext.hasMoved = true;
    if (!dragContext.dragStarted && !this.dragState.isDraggingTask) {
      if (this.dragState.dragDelayTimeout) {
        clearTimeout(this.dragState.dragDelayTimeout);
        this.dragState.dragDelayTimeout = null;
      }
      this.startTaskDrag(e.clientX, e.clientY, task, originalEvent.target as HTMLElement);
      dragContext.dragStarted = true;
    }
  }

  /**
   * Creates the mouse up event handler for ending drag operations.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @param resolve - Promise resolve function
   * @param handleMouseMove - The mouse move handler to remove
   * @returns Mouse up event handler function
   * @private
   */
  private createMouseUpHandler(onTaskUpdate: () => void, resolve: (value: boolean) => void, handleMouseMove: (e: MouseEvent) => void): () => void {
    return () => {
      this.dragState.isMousePressed = false;
      if (this.dragState.dragDelayTimeout) {
        clearTimeout(this.dragState.dragDelayTimeout);
        this.dragState.dragDelayTimeout = null;
      }
      
      if (this.dragState.isDraggingTask) {
        this.endTaskDrag(onTaskUpdate);
        resolve(true);
      } else {
        resolve(false);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', arguments.callee as EventListener);
    };
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
      this.dragState.longPressTimeout = setTimeout(() => {
        this.startTaskDrag(touch.clientX, touch.clientY, task, event.target as HTMLElement);
        dragStarted = true;
      }, 500);

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (this.dragState.isDraggingTask) {
          e.preventDefault();
          this.autoScroll.emergencyAutoScroll(e);
          this.updateTaskDrag(touch.clientX, touch.clientY);
        } else {
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
          resolve(true);
        } else {
          resolve(false);
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
    this.enableDragOverflow();
    const taskCard = element.closest('.task-card') as HTMLElement;
    if (taskCard) {
      this.dragState.dragElement = taskCard.cloneNode(true) as HTMLElement;
      this.dragState.dragElement.style.position = 'fixed';
      this.dragState.dragElement.style.pointerEvents = 'none';
      this.dragState.dragElement.style.zIndex = '9999';
      this.dragState.dragElement.style.transform = 'rotate(5deg)';
      this.dragState.dragElement.style.transition = 'none';
      this.dragState.dragElement.style.width = taskCard.offsetWidth + 'px';
      this.dragState.dragElement.style.height = taskCard.offsetHeight + 'px';
      this.dragState.dragElement.classList.add('task-dragging');
      const rect = taskCard.getBoundingClientRect();
      this.dragState.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      this.dragState.updateDragElementPosition(clientX, clientY);
      document.body.appendChild(this.dragState.dragElement);
      taskCard.classList.add('task-dragging-original');
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
    this.autoScroll.handleAutoScroll(clientY);
    this.dragState.updateDragElementPosition(clientX, clientY);
    const targetColumn = this.dragDetection.getColumnAtPosition(clientX, clientY);
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
  }

  /**
   * Ends the task drag operation and updates task position if dropped on valid target.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @private
   */
  private endTaskDrag(onTaskUpdate: () => void): void {
    if (!this.dragState.draggedTask) return;
    if (this.dragState.dragOverColumn && this.dragState.dragOverColumn !== this.dragState.draggedTask.column) {
      this.dragState.draggedTask.column = this.dragState.dragOverColumn;
      this.taskService.updateTask(this.dragState.draggedTask.id!, this.dragState.draggedTask);
      onTaskUpdate();
    }
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
    if (this.dragState.dragElement) {
      document.body.removeChild(this.dragState.dragElement);
    }
    const draggingElements = document.querySelectorAll('.task-dragging-original');
    draggingElements.forEach(el => el.classList.remove('task-dragging-original'));
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

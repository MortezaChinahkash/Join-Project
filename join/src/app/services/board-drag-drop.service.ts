import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { TaskService } from './task.service';

/**
 * Service for handling drag & drop functionality in the board component.
 * Manages task dragging, column detection, and visual feedback for both desktop and mobile.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragDropService {
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
  
  // New properties for click detection
  isMousePressed = false;
  mouseDownTime = 0;
  dragThreshold = 5; // pixels to move before considering it a drag
  dragDelay = 150; // milliseconds before drag starts
  dragDelayTimeout: any = null;
  initialMousePosition = { x: 0, y: 0 };

  constructor(private taskService: TaskService) {}

  /**
   * Handles mouse down events on tasks for desktop drag & drop functionality.
   * Initiates task dragging with left mouse button click and sets up mouse event listeners.
   * Now includes delay and distance threshold to prevent interference with click events.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a click
   */
  onTaskMouseDown(event: MouseEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      // Prevent default but don't prevent the click event from firing
      // event.preventDefault();
      
      // Only handle left mouse button
      if (event.button !== 0) {
        resolve(false);
        return;
      }
      
      this.isMousePressed = true;
      this.mouseDownTime = Date.now();
      this.initialMousePosition = { x: event.clientX, y: event.clientY };
      
      let hasMoved = false;
      let dragStarted = false;
      
      // Start delay timer for drag
      this.dragDelayTimeout = setTimeout(() => {
        if (this.isMousePressed && !hasMoved) {
          this.startTaskDrag(event.clientX, event.clientY, task, event.target as HTMLElement);
          dragStarted = true;
        }
      }, this.dragDelay);
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!this.isMousePressed) return;
        
        const deltaX = Math.abs(e.clientX - this.initialMousePosition.x);
        const deltaY = Math.abs(e.clientY - this.initialMousePosition.y);
        
        if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
          hasMoved = true;
          
          // Start drag immediately if threshold is exceeded
          if (!dragStarted && !this.isDraggingTask) {
            if (this.dragDelayTimeout) {
              clearTimeout(this.dragDelayTimeout);
              this.dragDelayTimeout = null;
            }
            this.startTaskDrag(e.clientX, e.clientY, task, event.target as HTMLElement);
            dragStarted = true;
          }
        }
        
        if (this.isDraggingTask) {
          this.updateTaskDrag(e.clientX, e.clientY);
        }
      };
      
      const handleMouseUp = () => {
        this.isMousePressed = false;
        
        if (this.dragDelayTimeout) {
          clearTimeout(this.dragDelayTimeout);
          this.dragDelayTimeout = null;
        }
        
        if (this.isDraggingTask) {
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
   * Implements long press detection (500ms) to initiate dragging on touch devices.
   * 
   * @param event - The touch event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a tap
   */
  onTaskTouchStart(event: TouchEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      event.preventDefault();
      
      this.touchStartTime = Date.now();
      const touch = event.touches[0];
      let dragStarted = false;
      
      // Start long press timer for mobile
      this.longPressTimeout = setTimeout(() => {
        this.startTaskDrag(touch.clientX, touch.clientY, task, event.target as HTMLElement);
        dragStarted = true;
      }, 500); // 500ms long press
      
      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (this.isDraggingTask) {
          e.preventDefault();
          this.updateTaskDrag(touch.clientX, touch.clientY);
        } else {
          // Cancel long press if user moves finger before drag starts
          if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
          }
        }
      };
      
      const handleTouchEnd = () => {
        if (this.longPressTimeout) {
          clearTimeout(this.longPressTimeout);
          this.longPressTimeout = null;
        }
        
        if (this.isDraggingTask) {
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
   * Creates a rotated clone of the task card and calculates the drag offset for smooth positioning.
   * 
   * @param clientX - The X coordinate of the mouse/touch position
   * @param clientY - The Y coordinate of the mouse/touch position  
   * @param task - The task object being dragged
   * @param element - The HTML element that triggered the drag
   * @private
   */
  private startTaskDrag(clientX: number, clientY: number, task: Task, element: HTMLElement) {
    this.draggedTask = task;
    this.isDraggingTask = true;
    this.dragStartPosition = { x: clientX, y: clientY };
    
    // Find the task card element
    const taskCard = element.closest('.task-card') as HTMLElement;
    if (taskCard) {
      // Clone the element for dragging
      this.dragElement = taskCard.cloneNode(true) as HTMLElement;
      this.dragElement.style.position = 'fixed';
      this.dragElement.style.pointerEvents = 'none';
      this.dragElement.style.zIndex = '9999';
      this.dragElement.style.transform = 'rotate(5deg)';
      this.dragElement.style.transition = 'none';
      this.dragElement.style.width = taskCard.offsetWidth + 'px';
      this.dragElement.style.height = taskCard.offsetHeight + 'px';
      this.dragElement.classList.add('task-dragging');
      
      // Calculate offset from mouse/touch to element
      const rect = taskCard.getBoundingClientRect();
      this.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      
      // Position the drag element
      this.dragElement.style.left = (clientX - this.dragOffset.x) + 'px';
      this.dragElement.style.top = (clientY - this.dragOffset.y) + 'px';
      
      document.body.appendChild(this.dragElement);
      
      // Add dragging class to original element
      taskCard.classList.add('task-dragging-original');
      
      // Store placeholder height
      this.dragPlaceholderHeight = taskCard.offsetHeight;
    }
  }

  /**
   * Updates the position of the dragged task element and determines target column.
   * Uses multiple detection methods: elementsFromPoint, geometric bounds, and event delegation
   * to accurately detect which column the task is being dragged over.
   * 
   * @param clientX - The current X coordinate of the mouse/touch position
   * @param clientY - The current Y coordinate of the mouse/touch position
   * @private
   */
  private updateTaskDrag(clientX: number, clientY: number) {
    if (!this.isDraggingTask || !this.dragElement) return;
    
    // Update drag element position
    this.dragElement.style.left = (clientX - this.dragOffset.x) + 'px';
    this.dragElement.style.top = (clientY - this.dragOffset.y) + 'px';
    
    // Primary method: Check which column we're over using elementFromPoint
    const elements = document.elementsFromPoint(clientX, clientY);
    let targetColumn: TaskColumn | null = null;
    
    for (const element of elements) {
      // Check for board-column element (main column container)
      const columnElement = element.closest('.board-column') as HTMLElement;
      if (columnElement) {
        targetColumn = columnElement.getAttribute('data-column') as TaskColumn;
        break;
      }
      
      // Also check for task-list element as fallback
      const taskListElement = element.closest('.task-list') as HTMLElement;
      if (taskListElement) {
        const parentColumn = taskListElement.closest('.board-column') as HTMLElement;
        if (parentColumn) {
          targetColumn = parentColumn.getAttribute('data-column') as TaskColumn;
          break;
        }
      }
      
      // Check for column-header as additional fallback
      const headerElement = element.closest('.column-header') as HTMLElement;
      if (headerElement) {
        const parentColumn = headerElement.closest('.board-column') as HTMLElement;
        if (parentColumn) {
          targetColumn = parentColumn.getAttribute('data-column') as TaskColumn;
          break;
        }
      }
    }
    
    // Fallback method: Use geometric bounds detection if primary method fails
    if (!targetColumn) {
      targetColumn = this.getColumnAtPosition(clientX, clientY);
    }
    
    // Update drag over column and show/hide placeholder
    if (targetColumn && targetColumn !== this.draggedTask?.column) {
      this.dragOverColumn = targetColumn;
      this.dragPlaceholderVisible = true;
    } else {
      this.dragOverColumn = null;
      this.dragPlaceholderVisible = false;
    }
  }

  /**
   * Enhanced column detection method using geometric bounds as fallback.
   * Iterates through all board columns and checks if the cursor position is within column boundaries.
   * 
   * @param clientX - The X coordinate to check
   * @param clientY - The Y coordinate to check
   * @returns The TaskColumn at the given position, or null if none found
   * @private
   */
  private getColumnAtPosition(clientX: number, clientY: number): TaskColumn | null {
    // Get all board columns
    const columns = document.querySelectorAll('.board-column') as NodeListOf<HTMLElement>;
    
    for (const column of columns) {
      const rect = column.getBoundingClientRect();
      
      // Check if the cursor is within the column bounds
      if (clientX >= rect.left && 
          clientX <= rect.right && 
          clientY >= rect.top && 
          clientY <= rect.bottom) {
        return column.getAttribute('data-column') as TaskColumn;
      }
    }
    
    return null;
  }

  /**
   * Completes the task dragging process and updates the task in Firebase if moved to a different column.
   * Cleans up the drag element, removes CSS classes, and updates the task's column in the database.
   * Resets all drag-related state variables after completion.
   * 
   * @param onTaskUpdate - Callback to update local task arrays after successful move
   * @private
   */
  private async endTaskDrag(onTaskUpdate: () => void) {
    if (!this.isDraggingTask || !this.draggedTask) return;
    
    // Remove drag element
    if (this.dragElement) {
      document.body.removeChild(this.dragElement);
      this.dragElement = null;
    }
    
    // Remove dragging classes
    const originalElement = document.querySelector('.task-dragging-original');
    if (originalElement) {
      originalElement.classList.remove('task-dragging-original');
    }
    
    // If dropped on a different column, move the task
    if (this.dragOverColumn && this.dragOverColumn !== this.draggedTask.column) {
      try {
        const updatedTask: Task = {
          ...this.draggedTask,
          column: this.dragOverColumn
        };
        
        await this.taskService.updateTaskInFirebase(updatedTask);
        
        // Call the update callback to refresh local arrays
        onTaskUpdate();
      } catch (error) {
        console.error('❌ Error moving task:', error);
      }
    }
    
    // Reset drag state
    this.isDraggingTask = false;
    this.draggedTask = null;
    this.dragOverColumn = null;
    this.dragPlaceholderVisible = false;
    this.dragPlaceholderHeight = 0;
    
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  /**
   * Handles drag over events on board columns to show visual feedback.
   * Prevents default behavior and shows placeholder when dragging over a different column.
   * 
   * @param event - The drag event from the column
   * @param column - The target column being dragged over
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn) {
    if (this.isDraggingTask && this.draggedTask && column !== this.draggedTask.column) {
      event.preventDefault();
      this.dragOverColumn = column;
      this.dragPlaceholderVisible = true;
    }
  }

  /**
   * Handles drag leave events on board columns to hide placeholder.
   * Only hides placeholder when actually leaving the column area (not moving to child elements).
   * 
   * @param event - The drag leave event from the column
   */
  onColumnDragLeave(event: DragEvent) {
    // Only hide placeholder if we're actually leaving the column area
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      this.dragOverColumn = null;
      this.dragPlaceholderVisible = false;
    }
  }

  /**
   * Handles drop events on board columns for proper event handling.
   * Prevents default behavior, actual drop logic is handled in endTaskDrag().
   * 
   * @param event - The drop event from the column
   * @param column - The target column where the task is being dropped
   */
  onColumnDrop(event: DragEvent, column: TaskColumn) {
    event.preventDefault();
    // The actual drop logic is handled in endTaskDrag()
    // This just ensures proper event handling
  }

  /**
   * Resets all drag & drop state variables.
   * Useful for cleanup when component is destroyed or when resetting the board state.
   */
  resetDragState() {
    this.isDraggingTask = false;
    this.draggedTask = null;
    this.dragOverColumn = null;
    this.dragPlaceholderVisible = false;
    this.dragPlaceholderHeight = 0;
    
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    
    if (this.dragElement) {
      document.body.removeChild(this.dragElement);
      this.dragElement = null;
    }
  }
}

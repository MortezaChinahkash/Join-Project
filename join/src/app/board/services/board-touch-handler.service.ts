import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { BoardDragStateService } from './board-drag-state.service';
import { BoardAutoScrollService } from './board-auto-scroll.service';

/**
 * Service for handling touch events and mobile drag operations.
 * Manages touch-specific drag behavior with long press detection.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardTouchHandlerService {
  
  private readonly LONG_PRESS_DURATION = 500; // milliseconds
  private readonly TOUCH_MOVE_THRESHOLD = 10; // pixels

  constructor(
    private dragState: BoardDragStateService,
    private autoScroll: BoardAutoScrollService
  ) {}

  /**
   * Handles touch start events for mobile drag functionality.
   * Implements long press detection to initiate drag operations.
   * 
   * @param event - Touch event
   * @param task - Task to be dragged
   * @param onTaskUpdate - Callback for task updates
   * @returns Promise resolving to true if drag started
   */
  onTaskTouchStart(event: TouchEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      const touch = event.touches[0];
      if (!touch) { resolve(false); return; }

      this.dragState.touchStartTime = Date.now();
      const startX = touch.clientX;
      const startY = touch.clientY;
      let hasMoved = false;
      let dragStarted = false;

      // Set up long press timeout
      this.dragState.longPressTimeout = setTimeout(() => {
        if (!hasMoved && !this.dragState.isDraggingTask) {
          this.startTouchDrag(startX, startY, task, event.target as HTMLElement);
          dragStarted = true;
          
          // Add haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
      }, this.LONG_PRESS_DURATION);

      const handleTouchMove = (e: TouchEvent) => {
        const moveTouch = e.touches[0];
        if (!moveTouch) return;

        const deltaX = Math.abs(moveTouch.clientX - startX);
        const deltaY = Math.abs(moveTouch.clientY - startY);

        if (deltaX > this.TOUCH_MOVE_THRESHOLD || deltaY > this.TOUCH_MOVE_THRESHOLD) {
          hasMoved = true;
          
          if (this.dragState.longPressTimeout) {
            clearTimeout(this.dragState.longPressTimeout);
            this.dragState.longPressTimeout = null;
          }
        }

        if (this.dragState.isDraggingTask) {
          e.preventDefault();
          this.autoScroll.emergencyAutoScroll(e);
          this.updateTouchDrag(moveTouch.clientX, moveTouch.clientY);
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        
        if (this.dragState.longPressTimeout) {
          clearTimeout(this.dragState.longPressTimeout);
          this.dragState.longPressTimeout = null;
        }

        if (this.dragState.isDraggingTask) {
          this.finishTouchDrag(onTaskUpdate);
        }

        resolve(dragStarted);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    });
  }

  /**
   * Starts touch drag operation.
   * 
   * @param clientX - Touch X position
   * @param clientY - Touch Y position
   * @param task - Task being dragged
   * @param targetElement - Target element
   */
  private startTouchDrag(clientX: number, clientY: number, task: Task, targetElement: HTMLElement): void {
    this.dragState.startDrag(task, clientX, clientY);
    
    // Create visual drag element
    this.createTouchDragElement(task, targetElement, clientX, clientY);
    
    // Hide original task
    const taskElement = targetElement.closest('.task-card') as HTMLElement;
    if (taskElement) {
      taskElement.style.opacity = '0.5';
    }
    
    // Initialize placeholder state
    this.dragState.setPlaceholder(false, 0);
  }

  /**
   * Updates touch drag position.
   * 
   * @param clientX - Current X position
   * @param clientY - Current Y position
   */
  private updateTouchDrag(clientX: number, clientY: number): void {
    this.dragState.updateDragPosition(clientX, clientY);
    this.autoScroll.handleAutoScroll(clientY);
    
    // Update drag over column with placeholder logic
    const column = this.getColumnAtPosition(clientX, clientY);
    const previousColumn = this.dragState.dragOverColumn;
    
    if (column !== previousColumn) {
      // Update placeholder visibility and height
      // Only show placeholder if we're over a different column than the original one
      if (column && this.dragState.draggedTask && column !== this.dragState.draggedTask.column) {
        // Get height from dragged task element
        const taskElement = document.querySelector('.task-card[style*="opacity: 0.5"]') as HTMLElement;
        const placeholderHeight = taskElement ? taskElement.offsetHeight : 80; // Same height as task card
        
        this.dragState.setPlaceholder(true, placeholderHeight);
      } else {
        this.dragState.setPlaceholder(false, 0);
      }
    }
    
    this.dragState.setDragOverColumn(column);
  }

  /**
   * Determines which column is at the given position.
   * 
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @returns Column at position or null
   */
  private getColumnAtPosition(clientX: number, clientY: number): TaskColumn | null {
    const elements = document.elementsFromPoint(clientX, clientY);
    
    for (const element of elements) {
      // Check for board-column class and data-column attribute
      if (element.classList.contains('board-column') || element.classList.contains('task-list')) {
        const columnId = element.getAttribute('data-column') || 
                        element.closest('[data-column]')?.getAttribute('data-column');
        
        switch (columnId) {
          case 'todo': return 'todo';
          case 'inprogress': return 'inprogress';
          case 'awaiting': return 'awaiting';
          case 'done': return 'done';
        }
      }
    }
    
    return null;
  }

  /**
   * Finishes touch drag operation.
   * 
   * @param onTaskUpdate - Callback for task updates
   */
  private finishTouchDrag(onTaskUpdate: () => void): void {
    // Remove drag element
    if (this.dragState.dragElement) {
      this.dragState.dragElement.remove();
    }

    // Restore original task visibility
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
      (card as HTMLElement).style.opacity = '';
    });

    // Handle drop logic
    if (this.dragState.dragOverColumn && this.dragState.draggedTask) {
      this.handleTaskDrop(onTaskUpdate);
    }

    // Hide placeholder
    this.dragState.setPlaceholder(false, 0);

    // Cleanup
    this.dragState.resetDragState();
    this.autoScroll.stopAutoScroll();
  }

  /**
   * Creates visual drag element for touch.
   * 
   * @param task - Task being dragged
   * @param originalElement - Original task element
   * @param clientX - X position
   * @param clientY - Y position
   */
  private createTouchDragElement(task: Task, originalElement: HTMLElement, clientX: number, clientY: number): void {
    const taskElement = originalElement.closest('.task-card') as HTMLElement;
    if (!taskElement) return;

    const dragElement = taskElement.cloneNode(true) as HTMLElement;
    dragElement.style.position = 'fixed';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.zIndex = '10000';
    dragElement.style.transform = 'rotate(5deg)';
    dragElement.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    dragElement.style.opacity = '0.9';
    dragElement.style.width = `${taskElement.offsetWidth}px`;

    document.body.appendChild(dragElement);
    this.dragState.setDragElement(dragElement, clientX, clientY);
    this.dragState.updateDragPosition(clientX, clientY);
  }

  /**
   * Handles task drop logic.
   * 
   * @param onTaskUpdate - Callback for task updates
   */
  private handleTaskDrop(onTaskUpdate: () => void): void {
    if (!this.dragState.draggedTask || !this.dragState.dragOverColumn) return;

    // Update task column
    this.dragState.draggedTask.column = this.dragState.dragOverColumn;
    
    // Trigger update callback
    onTaskUpdate();
  }

  /**
   * Handles touch cancel events.
   */
  onTouchCancel(): void {
    if (this.dragState.longPressTimeout) {
      clearTimeout(this.dragState.longPressTimeout);
      this.dragState.longPressTimeout = null;
    }
    
    if (this.dragState.isDraggingTask) {
      this.cancelTouchDrag();
    }
  }

  /**
   * Cancels ongoing touch drag operation.
   */
  private cancelTouchDrag(): void {
    // Remove drag element
    if (this.dragState.dragElement) {
      this.dragState.dragElement.remove();
    }

    // Restore original task visibility
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
      (card as HTMLElement).style.opacity = '';
    });

    // Cleanup state
    this.dragState.resetDragState();
    this.autoScroll.stopAutoScroll();
  }

  /**
   * Cleanup method.
   */
  cleanup(): void {
    this.dragState.clearTimeouts();
    this.autoScroll.cleanup();
  }
}

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
  private readonly LONG_PRESS_DURATION = 500;
  private readonly TOUCH_MOVE_THRESHOLD = 10;
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
      
      const touchContext = this.initializeTouchDragState(event, task);
      const handleTouchMove = this.createTouchMoveHandler(touchContext);
      const handleTouchEnd = this.createTouchEndHandler(onTaskUpdate, resolve, touchContext, handleTouchMove);
      
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    });
  }

  /**
   * Initializes the touch drag state and sets up the long press timeout.
   * 
   * @param event - The touch event
   * @param task - The task object being dragged
   * @returns Object containing touch context variables
   * @private
   */
  private initializeTouchDragState(event: TouchEvent, task: Task): { startX: number; startY: number; hasMoved: boolean; dragStarted: boolean } {
    const touch = event.touches[0];
    this.recordTouchStartTime();
    const touchContext = this.createTouchContext(touch);
    this.setupLongPressTimeout(touchContext, task, event);
    return touchContext;
  }

  /**
   * Records the touch start time for duration tracking.
   * 
   * @private
   */
  private recordTouchStartTime(): void {
    this.dragState.touchStartTime = Date.now();
  }

  /**
   * Creates the initial touch context object.
   * 
   * @param touch - The touch object from the event
   * @returns Touch context with initial values
   * @private
   */
  private createTouchContext(touch: Touch): { startX: number; startY: number; hasMoved: boolean; dragStarted: boolean } {
    return { 
      startX: touch.clientX, 
      startY: touch.clientY, 
      hasMoved: false, 
      dragStarted: false 
    };
  }

  /**
   * Sets up the long press timeout for drag initiation.
   * 
   * @param touchContext - The touch context object
   * @param task - The task object being dragged
   * @param event - The original touch event
   * @private
   */
  private setupLongPressTimeout(touchContext: { startX: number; startY: number; hasMoved: boolean; dragStarted: boolean }, task: Task, event: TouchEvent): void {
    this.dragState.longPressTimeout = setTimeout(() => {
      this.handleLongPressActivation(touchContext, task, event);
    }, this.LONG_PRESS_DURATION);
  }

  /**
   * Handles the activation of long press for drag start.
   * 
   * @param touchContext - The touch context object
   * @param task - The task object being dragged
   * @param event - The original touch event
   * @private
   */
  private handleLongPressActivation(touchContext: { startX: number; startY: number; hasMoved: boolean; dragStarted: boolean }, task: Task, event: TouchEvent): void {
    if (!touchContext.hasMoved && !this.dragState.isDraggingTask) {
      this.initiateTouchDrag(touchContext, task, event);
    }
  }

  /**
   * Initiates the touch drag operation.
   * 
   * @param touchContext - The touch context object
   * @param task - The task object being dragged
   * @param event - The original touch event
   * @private
   */
  private initiateTouchDrag(touchContext: { startX: number; startY: number; dragStarted: boolean }, task: Task, event: TouchEvent): void {
    this.startTouchDrag(touchContext.startX, touchContext.startY, task, event.target as HTMLElement);
    touchContext.dragStarted = true;
    this.tryVibrate();
  }

  /**
   * Creates the touch move event handler for drag operations.
   * 
   * @param touchContext - The touch context containing position and state
   * @returns Touch move event handler function
   * @private
   */
  private createTouchMoveHandler(touchContext: { startX: number; startY: number; hasMoved: boolean; dragStarted: boolean }): (e: TouchEvent) => void {
    return (e: TouchEvent) => {
      const moveTouch = e.touches[0];
      if (!moveTouch) return;
      
      const deltaX = Math.abs(moveTouch.clientX - touchContext.startX);
      const deltaY = Math.abs(moveTouch.clientY - touchContext.startY);
      
      if (deltaX > this.TOUCH_MOVE_THRESHOLD || deltaY > this.TOUCH_MOVE_THRESHOLD) {
        this.handleTouchMovementThreshold(touchContext);
      }
      
      if (this.dragState.isDraggingTask) {
        e.preventDefault();
        this.autoScroll.emergencyAutoScroll(e);
        this.updateTouchDrag(moveTouch.clientX, moveTouch.clientY);
      }
    };
  }

  /**
   * Handles touch movement that exceeds the movement threshold.
   * 
   * @param touchContext - The touch context containing movement state
   * @private
   */
  private handleTouchMovementThreshold(touchContext: { hasMoved: boolean }): void {
    touchContext.hasMoved = true;
    if (this.dragState.longPressTimeout) {
      clearTimeout(this.dragState.longPressTimeout);
      this.dragState.longPressTimeout = null;
    }
  }

  /**
   * Creates the touch end event handler for ending drag operations.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @param resolve - Promise resolve function
   * @param touchContext - The touch context containing drag state
   * @param handleTouchMove - The touch move handler to remove
   * @returns Touch end event handler function
   * @private
   */
  private createTouchEndHandler(onTaskUpdate: () => void, resolve: (value: boolean) => void, touchContext: { dragStarted: boolean }, handleTouchMove: (e: TouchEvent) => void): (e: TouchEvent) => void {
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
      
      resolve(touchContext.dragStarted);
    };
    return handleTouchEnd;
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
    this.createTouchDragElement(task, targetElement, clientX, clientY);
    const taskElement = targetElement.closest('.task-card') as HTMLElement;
    if (taskElement) {
      taskElement.style.opacity = '0.5';
    }
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
    this.autoScroll.handleAutoScroll(clientX, clientY);
    const column = this.getColumnAtPosition(clientX, clientY);
    const previousColumn = this.dragState.dragOverColumn;
    if (column !== previousColumn) {
      if (column && this.dragState.draggedTask && column !== this.dragState.draggedTask.column) {
        const taskElement = document.querySelector('.task-card[style*="opacity: 0.5"]') as HTMLElement;
        const placeholderHeight = taskElement ? taskElement.offsetHeight : 80;
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
    if (this.dragState.dragElement) {
      this.dragState.dragElement.remove();
    }
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
      (card as HTMLElement).style.opacity = '';
    });
    if (this.dragState.dragOverColumn && this.dragState.draggedTask) {
      this.handleTaskDrop(onTaskUpdate);
    }
    this.dragState.setPlaceholder(false, 0);
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
    this.dragState.draggedTask.column = this.dragState.dragOverColumn;
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
    if (this.dragState.dragElement) {
      this.dragState.dragElement.remove();
    }
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
      (card as HTMLElement).style.opacity = '';
    });
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

  /**
   * Safely attempts to trigger device vibration if supported and allowed.
   * @private
   */
  private tryVibrate(): void {
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(50);
      }
    } catch (error) {
    }
  }
}

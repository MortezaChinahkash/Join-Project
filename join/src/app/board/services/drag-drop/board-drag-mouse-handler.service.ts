import { Injectable } from '@angular/core';
import { Task } from '../../../interfaces/task.interface';
import { BoardDragStateService } from './board-drag-state.service';

/**
 * Service for handling mouse-based drag operations.
 * Manages mouse events for desktop drag & drop functionality.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragMouseHandlerService {

  constructor(private dragState: BoardDragStateService) {}

  /**
   * Handles mouse down events on tasks for desktop drag & drop functionality.
   */
  onTaskMouseDown(
    event: MouseEvent, 
    task: Task, 
    onTaskUpdate: () => void,
    startDragCallback: (clientX: number, clientY: number, task: Task, element: HTMLElement) => void,
    endDragCallback: (onTaskUpdate: () => void) => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (event.button !== 0) {
        resolve(false);
        return;
      }
      
      const dragContext = this.initializeMouseDragState(event, task, startDragCallback);
      const handleMouseMove = this.createMouseMoveHandler(event, task, dragContext, startDragCallback);
      const handleMouseUp = this.createMouseUpHandler(onTaskUpdate, resolve, handleMouseMove, endDragCallback);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  /**
   * Initializes the mouse drag state and sets up the delay timeout.
   */
  private initializeMouseDragState(
    event: MouseEvent, 
    task: Task,
    startDragCallback: (clientX: number, clientY: number, task: Task, element: HTMLElement) => void
  ): { hasMoved: boolean; dragStarted: boolean } {
    this.dragState.isMousePressed = true;
    this.dragState.mouseDownTime = Date.now();
    this.dragState.initialMousePosition = { x: event.clientX, y: event.clientY };
    const dragContext = { hasMoved: false, dragStarted: false };
    
    this.dragState.dragDelayTimeout = setTimeout(() => {
      if (this.dragState.isMousePressed && !dragContext.hasMoved) {
        startDragCallback(event.clientX, event.clientY, task, event.target as HTMLElement);
        dragContext.dragStarted = true;
      }
    }, this.dragState.dragDelay);
    
    return dragContext;
  }

  /**
   * Creates the mouse move event handler for drag operations.
   */
  private createMouseMoveHandler(
    event: MouseEvent, 
    task: Task, 
    dragContext: { hasMoved: boolean; dragStarted: boolean },
    startDragCallback: (clientX: number, clientY: number, task: Task, element: HTMLElement) => void
  ): (e: MouseEvent) => void {
    return (e: MouseEvent) => {
      if (!this.dragState.isMousePressed) return;
      
      const deltaX = Math.abs(e.clientX - this.dragState.initialMousePosition.x);
      const deltaY = Math.abs(e.clientY - this.dragState.initialMousePosition.y);
      
      if (deltaX > this.dragState.dragThreshold || deltaY > this.dragState.dragThreshold) {
        this.handleMouseMovementThreshold(e, task, event, dragContext, startDragCallback);
      }
      
      if (this.dragState.isDraggingTask) {
        e.preventDefault();
        // Update drag position handled by parent service
      }
    };
  }

  /**
   * Handles mouse movement that exceeds the drag threshold.
   */
  private handleMouseMovementThreshold(
    e: MouseEvent, 
    task: Task, 
    originalEvent: MouseEvent, 
    dragContext: { hasMoved: boolean; dragStarted: boolean },
    startDragCallback: (clientX: number, clientY: number, task: Task, element: HTMLElement) => void
  ): void {
    dragContext.hasMoved = true;
    if (!dragContext.dragStarted && !this.dragState.isDraggingTask) {
      if (this.dragState.dragDelayTimeout) {
        clearTimeout(this.dragState.dragDelayTimeout);
        this.dragState.dragDelayTimeout = null;
      }
      startDragCallback(e.clientX, e.clientY, task, originalEvent.target as HTMLElement);
      dragContext.dragStarted = true;
    }
  }

  /**
   * Creates the mouse up event handler for ending drag operations.
   */
  private createMouseUpHandler(
    onTaskUpdate: () => void, 
    resolve: (value: boolean) => void, 
    handleMouseMove: (e: MouseEvent) => void,
    endDragCallback: (onTaskUpdate: () => void) => void
  ): () => void {
    return () => {
      this.dragState.isMousePressed = false;
      if (this.dragState.dragDelayTimeout) {
        clearTimeout(this.dragState.dragDelayTimeout);
        this.dragState.dragDelayTimeout = null;
      }
      
      if (this.dragState.isDraggingTask) {
        endDragCallback(onTaskUpdate);
        resolve(true);
      } else {
        resolve(false);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', arguments.callee as EventListener);
    };
  }
}

import { Injectable } from '@angular/core';
import { Task } from '../../../interfaces/task.interface';
import { BoardDragStateService } from './board-drag-state.service';
import { BoardDragAutoScrollService } from './board-drag-auto-scroll.service';

/**
 * Service for handling touch-based drag operations.
 * Manages touch events for mobile drag & drop functionality.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragTouchHandlerService {

  /**
   * Initializes the drag touch handler service with required dependencies.
   * 
   * @param dragState - Service for managing drag state
   * @param autoScroll - Service for auto-scroll functionality during drag
   */
  constructor(
    private dragState: BoardDragStateService,
    private autoScroll: BoardDragAutoScrollService
  ) {}

  /**
   * Handles touch start events on tasks for mobile drag & drop functionality.
   */
  onTaskTouchStart(
    event: TouchEvent, 
    task: Task, 
    onTaskUpdate: () => void,
    startDragCallback: (clientX: number, clientY: number, task: Task, element: HTMLElement) => void,
    endDragCallback: (onTaskUpdate: () => void) => void,
    updateDragCallback: (clientX: number, clientY: number) => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      event.preventDefault();
      const touch = event.touches[0];
      const dragContext = this.initializeTouchDragState(event, touch, task, startDragCallback);
      const handleTouchMove = this.createTouchMoveHandler(updateDragCallback);
      const handleTouchEnd = this.createTouchEndHandler(onTaskUpdate, resolve, handleTouchMove, endDragCallback);
      this.attachTouchEventListeners(handleTouchMove, handleTouchEnd);
    });
  }

  /**
   * Initializes touch drag state and sets up long press timeout.
   */
  private initializeTouchDragState(
    event: TouchEvent, 
    touch: Touch, 
    task: Task,
    startDragCallback: (clientX: number, clientY: number, task: Task, element: HTMLElement) => void
  ): { dragStarted: boolean } {
    const dragContext = { dragStarted: false };
    this.dragState.longPressTimeout = setTimeout(() => {
      startDragCallback(touch.clientX, touch.clientY, task, event.target as HTMLElement);
      dragContext.dragStarted = true;
    }, 500);
    return dragContext;
  }

  /**
   * Creates the touch move event handler for drag operations.
   */
  private createTouchMoveHandler(updateDragCallback: (clientX: number, clientY: number) => void): (e: TouchEvent) => void {
    return (e: TouchEvent) => {
      const touch = e.touches[0];
      if (this.dragState.isDraggingTask) {
        this.handleActiveTouchDrag(e, touch, updateDragCallback);
      } else {
        this.cancelLongPressTimeout();
      }
    };
  }

  /**
   * Handles touch drag when dragging is active.
   */
  private handleActiveTouchDrag(e: TouchEvent, touch: Touch, updateDragCallback: (clientX: number, clientY: number) => void): void {
    e.preventDefault();
    this.autoScroll.emergencyAutoScroll(e);
    updateDragCallback(touch.clientX, touch.clientY);
  }

  /**
   * Cancels the long press timeout if it exists.
   */
  private cancelLongPressTimeout(): void {
    if (this.dragState.longPressTimeout) {
      clearTimeout(this.dragState.longPressTimeout);
      this.dragState.longPressTimeout = null;
    }
  }

  /**
   * Creates the touch end event handler for ending drag operations.
   */
  private createTouchEndHandler(
    onTaskUpdate: () => void, 
    resolve: (value: boolean) => void, 
    handleTouchMove: (e: TouchEvent) => void,
    endDragCallback: (onTaskUpdate: () => void) => void
  ): () => void {
    return () => {
      this.cancelLongPressTimeout();
      this.resolveTouchDragEnd(onTaskUpdate, resolve, endDragCallback);
      this.removeTouchEventListeners(handleTouchMove, arguments.callee as EventListener);
    };
  }

  /**
   * Resolves touch drag end and returns whether drag was active.
   */
  private resolveTouchDragEnd(
    onTaskUpdate: () => void, 
    resolve: (value: boolean) => void,
    endDragCallback: (onTaskUpdate: () => void) => void
  ): boolean {
    if (this.dragState.isDraggingTask) {
      endDragCallback(onTaskUpdate);
      resolve(true);
      return true;
    } else {
      resolve(false);
      return false;
    }
  }

  /**
   * Attaches touch event listeners to the document.
   */
  private attachTouchEventListeners(handleTouchMove: (e: TouchEvent) => void, handleTouchEnd: () => void): void {
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }

  /**
   * Removes touch event listeners from the document.
   */
  private removeTouchEventListeners(handleTouchMove: (e: TouchEvent) => void, handleTouchEnd: EventListener): void {
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }
}

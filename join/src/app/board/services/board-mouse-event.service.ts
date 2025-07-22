import { Injectable } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { BoardDragStateService } from './board-drag-state.service';
import { BoardAutoScrollService } from './board-auto-scroll.service';
import { BoardDragElementService } from './board-drag-element.service';

/**
 * Service for handling mouse events during drag and drop operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from BoardDragDropService
 */
@Injectable({ providedIn: 'root' })
export class BoardMouseEventService {

  /**
   * Initializes the mouse event service with required dependencies.
   * 
   * @param dragState - Service for managing drag state
   * @param autoScroll - Service for auto-scroll functionality
   * @param dragElement - Service for drag element operations
   */
  constructor(
    private dragState: BoardDragStateService,
    private autoScroll: BoardAutoScrollService,
    private dragElement: BoardDragElementService
  ) {}

  /**
   * Initializes mouse drag operation and sets up initial state.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @returns Object containing drag context variables
   */
  initializeMouseDragOperation(event: MouseEvent, task: Task): { hasMoved: boolean; dragStarted: boolean } {
    this.dragState.setMousePressed(event.clientX, event.clientY);
    const dragContext = { hasMoved: false, dragStarted: false };
    this.setupMouseDragDelayTimer(event, task, dragContext);
    return dragContext;
  }

  /**
   * Sets up the mouse drag delay timer to prevent accidental drags.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @param dragContext - The drag context containing movement state
   * @private
   */
  private setupMouseDragDelayTimer(event: MouseEvent, task: Task, dragContext: { hasMoved: boolean; dragStarted: boolean }): void {
    this.dragState.dragDelayTimeout = setTimeout(() => {
      if (this.dragState.isMousePressed && !dragContext.hasMoved) {
        this.startTaskDrag(event.clientX, event.clientY, task, event.target as HTMLElement);
        dragContext.dragStarted = true;
      }
    }, this.dragState.dragDelay);
  }

  /**
   * Creates mouse event handlers for drag operations.
   * 
   * @param event - The original mouse event
   * @param task - The task object being dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @param resolve - Promise resolve function
   * @param dragContext - The drag context containing movement state
   * @param updateTaskDragCallback - Callback to update task drag position
   * @param finishTaskDragCallback - Callback to finish task drag
   * @returns Object containing event handler functions
   */
  createMouseEventHandlers(
    event: MouseEvent, 
    task: Task, 
    onTaskUpdate: () => void, 
    resolve: (value: boolean) => void, 
    dragContext: { hasMoved: boolean; dragStarted: boolean },
    updateTaskDragCallback: (clientX: number, clientY: number) => void,
    finishTaskDragCallback: (onTaskUpdate: () => void) => void
  ): { mouseMove: (e: MouseEvent) => void; mouseUp: () => void } {
    const mouseMove = this.createMouseMoveEventHandler(event, task, dragContext, updateTaskDragCallback);
    const mouseUp = this.createMouseUpEventHandler(onTaskUpdate, resolve, mouseMove, dragContext, finishTaskDragCallback);
    return { mouseMove, mouseUp };
  }

  /**
   * Creates the mouse move event handler.
   * 
   * @param event - The original mouse event
   * @param task - The task object being dragged
   * @param dragContext - The drag context containing movement state
   * @param updateTaskDragCallback - Callback to update task drag position
   * @returns Mouse move event handler function
   * @private
   */
  private createMouseMoveEventHandler(
    event: MouseEvent, 
    task: Task, 
    dragContext: { hasMoved: boolean; dragStarted: boolean },
    updateTaskDragCallback: (clientX: number, clientY: number) => void
  ): (e: MouseEvent) => void {
    return (e: MouseEvent) => {
      if (!this.dragState.isMousePressed) return;
      this.processMouseMovement(e, event, task, dragContext);
      this.handleActiveMouseDrag(e, updateTaskDragCallback);
    };
  }

  /**
   * Processes mouse movement and handles drag threshold detection.
   * 
   * @param e - The current mouse event
   * @param originalEvent - The original mouse down event
   * @param task - The task object being dragged
   * @param dragContext - The drag context containing movement state
   * @private
   */
  private processMouseMovement(e: MouseEvent, originalEvent: MouseEvent, task: Task, dragContext: { hasMoved: boolean; dragStarted: boolean }): void {
    if (this.dragState.exceedsDragThreshold(e.clientX, e.clientY)) {
      dragContext.hasMoved = true;
      if (!dragContext.dragStarted && !this.dragState.isDraggingTask) {
        this.initiateThresholdDrag(e, originalEvent, task, dragContext);
      }
    }
  }

  /**
   * Initiates drag when movement threshold is exceeded.
   * 
   * @param e - The current mouse event
   * @param originalEvent - The original mouse down event
   * @param task - The task object being dragged
   * @param dragContext - The drag context containing movement state
   * @private
   */
  private initiateThresholdDrag(e: MouseEvent, originalEvent: MouseEvent, task: Task, dragContext: { hasMoved: boolean; dragStarted: boolean }): void {
    this.dragState.clearTimeouts();
    this.startTaskDrag(e.clientX, e.clientY, task, originalEvent.target as HTMLElement);
    dragContext.dragStarted = true;
  }

  /**
   * Handles active mouse drag operations.
   * 
   * @param e - The current mouse event
   * @param updateTaskDragCallback - Callback to update task drag position
   * @private
   */
  private handleActiveMouseDrag(e: MouseEvent, updateTaskDragCallback: (clientX: number, clientY: number) => void): void {
    if (this.dragState.isDraggingTask) {
      this.autoScroll.emergencyAutoScroll(e);
      updateTaskDragCallback(e.clientX, e.clientY);
    }
  }

  /**
   * Creates the mouse up event handler.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @param resolve - Promise resolve function
   * @param handleMouseMove - The mouse move handler to remove
   * @param dragContext - The drag context containing movement state
   * @param finishTaskDragCallback - Callback to finish task drag
   * @returns Mouse up event handler function
   * @private
   */
  private createMouseUpEventHandler(
    onTaskUpdate: () => void, 
    resolve: (value: boolean) => void, 
    handleMouseMove: (e: MouseEvent) => void, 
    dragContext: { hasMoved: boolean; dragStarted: boolean },
    finishTaskDragCallback: (onTaskUpdate: () => void) => void
  ): () => void {
    const handleMouseUp = () => {
      this.cleanupMouseEventListeners(handleMouseMove, handleMouseUp);
      this.finalizeMouseDragOperation(onTaskUpdate, resolve, dragContext, finishTaskDragCallback);
    };
    return handleMouseUp;
  }

  /**
   * Finalizes mouse drag operation and resolves promise.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @param resolve - Promise resolve function
   * @param dragContext - The drag context containing movement state
   * @param finishTaskDragCallback - Callback to finish task drag
   * @private
   */
  private finalizeMouseDragOperation(
    onTaskUpdate: () => void, 
    resolve: (value: boolean) => void, 
    dragContext: { hasMoved: boolean; dragStarted: boolean },
    finishTaskDragCallback: (onTaskUpdate: () => void) => void
  ): void {
    this.dragState.isMousePressed = false;
    this.dragState.clearTimeouts();
    if (this.dragState.isDraggingTask) {
      finishTaskDragCallback(onTaskUpdate);
    }
    resolve(dragContext.dragStarted);
  }

  /**
   * Attaches mouse event listeners to the document.
   * 
   * @param handleMouseMove - Mouse move handler function
   * @param handleMouseUp - Mouse up handler function
   */
  attachMouseEventListeners(handleMouseMove: (e: MouseEvent) => void, handleMouseUp: () => void): void {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  /**
   * Removes mouse event listeners from the document.
   * 
   * @param handleMouseMove - Mouse move handler function
   * @param handleMouseUp - Mouse up handler function
   * @private
   */
  private cleanupMouseEventListeners(handleMouseMove: (e: MouseEvent) => void, handleMouseUp: () => void): void {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  /**
   * Starts task drag operation for desktop.
   * 
   * @param clientX - Mouse X position
   * @param clientY - Mouse Y position
   * @param task - Task being dragged
   * @param targetElement - Target element
   * @private
   */
  private startTaskDrag(clientX: number, clientY: number, task: Task, targetElement: HTMLElement): void {
    this.dragState.startDrag(task, clientX, clientY);
    this.dragElement.createDragElement(task, targetElement, clientX, clientY);
    const taskElement = targetElement.closest('.task-card') as HTMLElement;
    if (taskElement) {
      taskElement.style.opacity = '0.5';
    }
    this.dragState.setPlaceholder(false, 0);
  }
}

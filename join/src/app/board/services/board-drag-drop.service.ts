import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardThumbnailService } from './board-thumbnail.service';
import { BoardDragStateService } from './board-drag-state.service';
import { BoardAutoScrollService } from './board-auto-scroll.service';
import { BoardTouchHandlerService } from './board-touch-handler.service';
import { BoardDragValidationService } from './board-drag-validation.service';
import { BoardDragCalculationService } from './board-drag-calculation.service';
import { BoardColumnDetectionService } from './board-column-detection.service';
import { BoardDragElementService } from './board-drag-element.service';
/**
 * Main service for handling drag & drop functionality in the board component.
 * Orchestrates task dragging, column detection, and visual feedback for both desktop and mobile.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 2.0.0 - Refactored into multiple specialized services
 */
@Injectable({ providedIn: 'root' })

export class BoardDragDropService {
  /** Constructor initializes drag drop service with dependencies */
  constructor(
    private taskService: TaskService,
    private boardThumbnailService: BoardThumbnailService,
    private dragState: BoardDragStateService,
    private autoScroll: BoardAutoScrollService,
    private touchHandler: BoardTouchHandlerService,
    private dragValidation: BoardDragValidationService,
    private dragCalculation: BoardDragCalculationService,
    private columnDetection: BoardColumnDetectionService,
    private dragElement: BoardDragElementService
  ) {}
  
  /** Gets currently dragged task */
  get draggedTask(): Task | null { return this.dragState.draggedTask; }

  /** Gets drag operation state */
  get isDraggingTask(): boolean { return this.dragState.isDraggingTask; }

  /** Gets column being dragged over */
  get dragOverColumn(): TaskColumn | null { return this.dragState.dragOverColumn; }

  /** Gets drag placeholder visibility */
  get dragPlaceholderVisible(): boolean { return this.dragState.dragPlaceholderVisible; }

  /** Gets drag placeholder height */
  get dragPlaceholderHeight(): number { return this.dragState.dragPlaceholderHeight; }
  
  /**
   * Emergency cleanup method to restore board scroll wrapper overflow.
   * Can be called from components or external services.
   */
  emergencyCleanup(): void {
    this.dragState.emergencyCleanup();
  }

  /**
   * Handles mouse down events on tasks for desktop drag & drop functionality.
   * Initiates task dragging with left mouse button click and sets up mouse event listeners.
   * Includes delay and distance threshold to prevent interference with click events.
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
      const dragContext = this.initializeMouseDragOperation(event, task);
      const handlers = this.createMouseEventHandlers(event, task, onTaskUpdate, resolve, dragContext);
      this.attachMouseEventListeners(handlers.mouseMove, handlers.mouseUp);
    });
  }

  /**
   * Initializes mouse drag operation and sets up initial state.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @returns Object containing drag context variables
   * @private
   */
  private initializeMouseDragOperation(event: MouseEvent, task: Task): { hasMoved: boolean; dragStarted: boolean } {
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
   * @returns Object containing event handler functions
   * @private
   */
  private createMouseEventHandlers(event: MouseEvent, task: Task, onTaskUpdate: () => void, resolve: (value: boolean) => void, dragContext: { hasMoved: boolean; dragStarted: boolean }): { mouseMove: (e: MouseEvent) => void; mouseUp: () => void } {
    const mouseMove = this.createMouseMoveEventHandler(event, task, dragContext);
    const mouseUp = this.createMouseUpEventHandler(onTaskUpdate, resolve, mouseMove, dragContext);
    return { mouseMove, mouseUp };
  }

  /**
   * Creates the mouse move event handler.
   * 
   * @param event - The original mouse event
   * @param task - The task object being dragged
   * @param dragContext - The drag context containing movement state
   * @returns Mouse move event handler function
   * @private
   */
  private createMouseMoveEventHandler(event: MouseEvent, task: Task, dragContext: { hasMoved: boolean; dragStarted: boolean }): (e: MouseEvent) => void {
    return (e: MouseEvent) => {
      if (!this.dragState.isMousePressed) return;
      this.processMouseMovement(e, event, task, dragContext);
      this.handleActiveMouseDrag(e);
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
   * @private
   */
  private handleActiveMouseDrag(e: MouseEvent): void {
    if (this.dragState.isDraggingTask) {
      this.autoScroll.emergencyAutoScroll(e);
      this.updateTaskDrag(e.clientX, e.clientY);
    }
  }

  /**
   * Creates the mouse up event handler.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @param resolve - Promise resolve function
   * @param handleMouseMove - The mouse move handler to remove
   * @param dragContext - The drag context containing movement state
   * @returns Mouse up event handler function
   * @private
   */
  private createMouseUpEventHandler(onTaskUpdate: () => void, resolve: (value: boolean) => void, handleMouseMove: (e: MouseEvent) => void, dragContext: { hasMoved: boolean; dragStarted: boolean }): () => void {
    const handleMouseUp = () => {
      this.cleanupMouseEventListeners(handleMouseMove, handleMouseUp);
      this.finalizeMouseDragOperation(onTaskUpdate, resolve, dragContext);
    };
    return handleMouseUp;
  }

  /**
   * Finalizes mouse drag operation and resolves promise.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @param resolve - Promise resolve function
   * @param dragContext - The drag context containing movement state
   * @private
   */
  private finalizeMouseDragOperation(onTaskUpdate: () => void, resolve: (value: boolean) => void, dragContext: { hasMoved: boolean; dragStarted: boolean }): void {
    this.dragState.isMousePressed = false;
    this.dragState.clearTimeouts();
    if (this.dragState.isDraggingTask) {
      this.finishTaskDrag(onTaskUpdate);
    }
    resolve(dragContext.dragStarted);
  }

  /**
   * Attaches mouse event listeners to the document.
   * 
   * @param handleMouseMove - Mouse move handler function
   * @param handleMouseUp - Mouse up handler function
   * @private
   */
  private attachMouseEventListeners(handleMouseMove: (e: MouseEvent) => void, handleMouseUp: () => void): void {
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
   * Handles touch start events on tasks for mobile drag & drop functionality.
   * Delegates to TouchHandlerService for mobile-specific behavior.
   * 
   * @param event - The touch event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a tap
   */
  onTaskTouchStart(event: TouchEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return this.touchHandler.onTaskTouchStart(event, task, onTaskUpdate);
  }

  /**
   * Starts task drag operation for desktop.
   * 
   * @param clientX - Mouse X position
   * @param clientY - Mouse Y position
   * @param task - Task being dragged
   * @param targetElement - Target element
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

  /**
   * Updates task drag position with placeholder logic.
   * 
   * @param clientX - Current X position
   * @param clientY - Current Y position
   */
  private updateTaskDragWithPlaceholder(clientX: number, clientY: number): void {
    this.dragState.updateDragPosition(clientX, clientY);
    this.autoScroll.handleAutoScroll(clientX, clientY);
    const column = this.columnDetection.getColumnAtPosition(clientX, clientY);
    this.handleColumnChange(column, clientX, clientY);
    this.dragState.setDragOverColumn(column);
  }

  /**
   * Handles columnchange.
   * @param column - Column parameter
   * @param clientX - Clientx parameter
   * @param clientY - Clienty parameter
   */
  private handleColumnChange(column: TaskColumn | null, clientX: number, clientY: number): void {
    const previousColumn = this.dragState.dragOverColumn;
    if (column !== previousColumn) {
      this.updatePlaceholderForColumn(column);
    }
  }

  /**
   * Updates placeholderforcolumn.
   * @param column - Column parameter
   */
  private updatePlaceholderForColumn(column: TaskColumn | null): void {
    if (this.dragValidation.shouldShowPlaceholder(column, this.dragState.draggedTask)) {
      const placeholderHeight = this.dragCalculation.calculatePlaceholderHeight();
      this.dragState.setPlaceholder(true, placeholderHeight);
    } else {
      this.dragState.setPlaceholder(false, 0);
    }
  }

  /**
   * Updates task drag position.
   * 
   * @param clientX - Current X position
   * @param clientY - Current Y position
   */
  private updateTaskDrag(clientX: number, clientY: number): void {
    this.updateTaskDragWithPlaceholder(clientX, clientY);
  }

  /**
   * Finishes task drag operation.
   * 
   * @param onTaskUpdate - Callback for task updates
   */
  private finishTaskDrag(onTaskUpdate: () => void): void {
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
   * Handles task drop logic.
   * 
   * @param onTaskUpdate - Callback for task updates
   */
  private handleTaskDrop(onTaskUpdate: () => void): void {
    if (!this.dragValidation.validateDropPreconditions(this.dragState.draggedTask, this.dragState.dragOverColumn)) {
      return;
    }
    const oldColumn = this.dragState.draggedTask!.column;
    const newColumn = this.dragState.dragOverColumn!;
    this.processTaskColumnChange(oldColumn, newColumn, onTaskUpdate);
  }

  /**
   * Processes taskcolumnchange.
   * @param oldColumn - Oldcolumn parameter
   * @param newColumn - Newcolumn parameter
   * @param onTaskUpdate - Ontaskupdate parameter
   */
  private processTaskColumnChange(oldColumn: TaskColumn, newColumn: TaskColumn, onTaskUpdate: () => void): void {
    if (oldColumn !== newColumn) {
      this.updateTaskColumn(newColumn);
      this.updateTaskInFirebase(oldColumn);
    }
    onTaskUpdate();
  }

  /**
   * Updates taskcolumn.
   * @param newColumn - Newcolumn parameter
   */
  private updateTaskColumn(newColumn: TaskColumn): void {
    this.dragState.draggedTask!.column = newColumn;
  }

  /**
   * Updates taskinfirebase.
   * @param oldColumn - Oldcolumn parameter
   */
  private updateTaskInFirebase(oldColumn: TaskColumn): void {
    if (this.dragState.draggedTask!.id) {
      this.taskService.updateTaskInFirebase(this.dragState.draggedTask!)
        .then(() => {        })

        .catch((error) => {
          this.handleFirebaseUpdateError(error, oldColumn);
        });
    }
  }
  /**
   * Handles firebaseupdateerror.
   * @param error - Error parameter
   * @param oldColumn - Oldcolumn parameter
   */
  private handleFirebaseUpdateError(error: any, oldColumn: TaskColumn): void {
    console.error('Error updating task in Firebase:', error);
    this.dragState.draggedTask!.column = oldColumn;
  }

  /**
   * Handles drag over events on columns.
   * 
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
    this.dragState.setDragOverColumn(column);
  }

  /**
   * Handles drag leave events on columns.
   * 
   * @param event - Drag event
   */
  onColumnDragLeave(event: DragEvent): void {
    if (!event.relatedTarget || !event.currentTarget) return;
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      this.dragState.setDragOverColumn(null);
    }
  }

  /**
   * Handles drop events on columns.
   * 
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
    if (this.dragState.draggedTask) {
      this.dragState.setDragOverColumn(column);
    }
  }

  /**
   * Public method for updating drag position (used by touch handler).
   * 
   * @param clientX - Current X position
   * @param clientY - Current Y position
   */
  updateDragPosition(clientX: number, clientY: number): void {
    this.updateTaskDragWithPlaceholder(clientX, clientY);
  }

  /**
   * Cleanup method to stop all drag operations and clean up state.
   */
  cleanup(): void {
    this.dragState.resetDragState();
    this.autoScroll.cleanup();
    this.touchHandler.cleanup();
  }
}

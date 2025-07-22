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
import { BoardFirebaseUpdateService } from './board-firebase-update.service';
import { BoardColumnEventService } from './board-column-event.service';
import { BoardDragCleanupService } from './board-drag-cleanup.service';
import { BoardMouseEventService } from './board-mouse-event.service';
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
    private dragElement: BoardDragElementService,
    private firebaseUpdate: BoardFirebaseUpdateService,
    private columnEvent: BoardColumnEventService,
    private dragCleanup: BoardDragCleanupService,
    private mouseEvent: BoardMouseEventService
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
      const dragContext = this.mouseEvent.initializeMouseDragOperation(event, task);
      const handlers = this.mouseEvent.createMouseEventHandlers(
        event, 
        task, 
        onTaskUpdate, 
        resolve, 
        dragContext,
        (clientX, clientY) => this.updateTaskDrag(clientX, clientY),
        (onTaskUpdate) => this.finishTaskDrag(onTaskUpdate)
      );
      this.mouseEvent.attachMouseEventListeners(handlers.mouseMove, handlers.mouseUp);
    });
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
    this.dragCleanup.finishTaskDragCleanup(onTaskUpdate, true, () => this.handleTaskDrop(onTaskUpdate));
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
    this.firebaseUpdate.processTaskColumnChange(oldColumn, newColumn, onTaskUpdate);
  }

  /**
   * Handles drag over events on columns.
   * 
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    this.columnEvent.onColumnDragOver(event, column);
  }

  /**
   * Handles drag leave events on columns.
   * 
   * @param event - Drag event
   */
  onColumnDragLeave(event: DragEvent): void {
    this.columnEvent.onColumnDragLeave(event);
  }

  /**
   * Handles drop events on columns.
   * 
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    this.columnEvent.onColumnDrop(event, column);
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

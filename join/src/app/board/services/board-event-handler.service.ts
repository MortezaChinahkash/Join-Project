import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';
import { BoardInteractionService } from './board-interaction.service';
import { MobileTaskMoveService } from './mobile-task-move.service';
import { BoardTaskManagementService } from './board-task-management.service';
import { BoardArrayManagementService } from './board-array-management.service';

/**
 * Service for handling board event interactions.
 * Delegates event handling to specialized services.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardEventHandlerService {
  
  /**
   * Initializes the board event handler service with required dependencies.
   * 
   * @param interactionService - Service for handling board interactions
   * @param mobileTaskMoveService - Service for mobile task movement
   * @param taskManagementService - Service for task management operations
   * @param arrayManagementService - Service for managing task arrays
   */
  constructor(
    private interactionService: BoardInteractionService,
    private mobileTaskMoveService: MobileTaskMoveService,
    private taskManagementService: BoardTaskManagementService,
    private arrayManagementService: BoardArrayManagementService
  ) {}

  /**
   * Handles task mouse down events.
   * @param event - Mouse event
   * @param task - Task being interacted with
   * @param updateCallback - Callback to update task arrays
   * @param openDetailsCallback - Callback to open task details
   */
  async handleTaskMouseDown(
    event: MouseEvent, 
    task: Task, 
    updateCallback: () => void,
    openDetailsCallback: (task: Task) => void
  ): Promise<void> {
    const wasDragged = await this.interactionService.handleTaskMouseDown(event, task, updateCallback);
    if (!wasDragged) setTimeout(() => openDetailsCallback(task), 0);
  }

  /**
   * Handles task touch start events.
   * @param event - Touch event
   * @param task - Task being interacted with
   * @param updateCallback - Callback to update task arrays
   * @param openDetailsCallback - Callback to open task details
   */
  async handleTaskTouchStart(
    event: TouchEvent, 
    task: Task, 
    updateCallback: () => void,
    openDetailsCallback: (task: Task) => void
  ): Promise<void> {
    const wasDragged = await this.interactionService.handleTaskTouchStart(event, task, updateCallback);
    if (!wasDragged) setTimeout(() => openDetailsCallback(task), 0);
  }

  /**
   * Handles task movement between columns.
   * @param task - Task being moved
   * @param fromColumn - Source column
   * @param toColumn - Target column
   * @param taskColumns - Current task column arrays
   * @param assignCallback - Callback to assign updated columns
   */
  handleTaskMove(
    task: Task, 
    fromColumn: TaskColumn | null, 
    toColumn: TaskColumn,
    taskColumns: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    assignCallback: (columns: any) => void
  ): void {
    const updatedColumns = this.arrayManagementService.handleTaskMovement(
      task,
      fromColumn,
      toColumn,
      taskColumns
    );
    assignCallback(updatedColumns);
  }

  /**
   * Moves selected task to previous column.
   * @param taskColumns - Current task column arrays
   * @param moveCallback - Callback for task movement
   */
  moveTaskToPreviousColumn(
    taskColumns: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    moveCallback: (task: Task, from: TaskColumn | null, to: TaskColumn) => void
  ): void {
    this.mobileTaskMoveService.moveTaskToPreviousColumn(taskColumns, moveCallback);
  }

  /**
   * Moves selected task to next column.
   * @param taskColumns - Current task column arrays
   * @param moveCallback - Callback for task movement
   */
  moveTaskToNextColumn(
    taskColumns: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    moveCallback: (task: Task, from: TaskColumn | null, to: TaskColumn) => void
  ): void {
    this.mobileTaskMoveService.moveTaskToNextColumn(taskColumns, moveCallback);
  }

  // Column drag events delegation
  /**
   * Handles drag over events on board columns.
   * 
   * @param event - Drag event
   * @param column - Target column being dragged over
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    this.interactionService.handleColumnDragOver(event, column);
  }

  /**
   * Handles drag leave events on board columns.
   * 
   * @param event - Drag event
   */
  onColumnDragLeave(event: DragEvent): void {
    this.interactionService.handleColumnDragLeave(event);
  }

  /**
   * Handles drop events on board columns.
   * 
   * @param event - Drag event
   * @param column - Target column for the drop
   */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    this.interactionService.handleColumnDrop(event, column);
  }

  // Thumbnail events delegation
  /**
   * Handles click events on board thumbnail.
   * 
   * @param event - Mouse event
   */
  onThumbnailClick(event: MouseEvent): void {
    this.interactionService.handleThumbnailClick(event);
  }

  /**
   * Handles touch start events on board thumbnail.
   * 
   * @param event - Touch event
   */
  onThumbnailTouchStart(event: TouchEvent): void {
    this.interactionService.handleThumbnailTouchStart(event);
  }

  // Viewport events delegation
  /**
   * Handles mouse down events on board viewport.
   * 
   * @param event - Mouse event
   */
  onViewportMouseDown(event: MouseEvent): void {
    this.interactionService.handleViewportMouseDown(event);
  }

  /**
   * Handles touch start events on board viewport.
   * 
   * @param event - Touch event
   */
  onViewportTouchStart(event: TouchEvent): void {
    this.interactionService.handleViewportTouchStart(event);
  }

  /**
   * Handles click events on board viewport.
   * 
   * @param event - Mouse event
   */
  onViewportClick(event: MouseEvent): void {
    this.interactionService.handleViewportClick(event);
  }

  // Mobile move events delegation
  /**
   * Handles mobile task move initiation.
   * 
   * @param event - Mouse or touch event
   * @param task - Task to be moved
   */
  onMobileMoveTask(event: MouseEvent | TouchEvent, task: Task): void {
    this.mobileTaskMoveService.onMobileMoveTask(event, task);
  }

  /**
   * Handles mouse down events on mobile move button.
   * 
   * @param event - Mouse event
   */
  onMobileMoveButtonMouseDown(event: MouseEvent): void {
    this.mobileTaskMoveService.onMobileMoveButtonMouseDown(event);
  }

  /**
   * Handles touch start events on mobile move button.
   * 
   * @param event - Touch event
   * @param task - Task associated with the button
   */
  onMobileMoveButtonTouchStart(event: TouchEvent, task: Task): void {
    this.mobileTaskMoveService.onMobileMoveButtonTouchStart(event, task);
  }
}

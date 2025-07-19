import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardMobileService } from './board-mobile.service';
/**
 * Service for handling mobile task movement functionality.
 * Manages mobile move overlay state and task column transitions.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
/**
 * Service for handling task movement operations on mobile devices.
 * Manages touch-based drag and drop functionality with mobile-specific optimizations.
 * 
 * This service provides methods for:
 * - Mobile touch event handling for task movement
 * - Task positioning and column transitions on mobile
 * - Touch feedback and visual indicators
 * - Mobile-specific drag and drop animations
 * - Gesture recognition and swipe operations
 * - Responsive task movement across different screen sizes
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 * @since 2024
 */
@Injectable({
  providedIn: 'root'
})
export class MobileTaskMoveService {
  // Mobile move overlay state
  showMobileMoveOverlay: boolean = false;
  selectedTaskForMove: Task | null = null;
  overlayPosition = { top: 0, right: 0 };
  constructor(
    private taskService: TaskService,
    private mobileService: BoardMobileService
  ) {}
  /**
   * Shows mobile task move overlay.
   * @param event - Click or Touch event
   * @param task - Task to move
   */
  onMobileMoveTask(event: MouseEvent | TouchEvent, task: Task): void {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    this.overlayPosition = this.mobileService.calculateOverlayPosition(button);
    this.selectedTaskForMove = task;
    this.showMobileMoveOverlay = true;
  }
  /**
   * Closes the mobile move overlay.
   */
  closeMobileMoveOverlay(): void {
    this.showMobileMoveOverlay = false;
    this.selectedTaskForMove = null;
    this.overlayPosition = { top: 0, right: 0 };
  }
  /**
   * Gets column display name.
   * @param column - Column identifier
   * @returns Human-readable column name
   */
  getColumnDisplayName(column: TaskColumn): string {
    return this.mobileService.getColumnDisplayName(column);
  }
  /**
   * Handles mobile move button mouse down event.
   * @param event - Mouse event
   */
  onMobileMoveButtonMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
  /**
   * Handles mobile move button touch start event.
   * @param event - Touch event
   * @param task - Task to move
   */
  onMobileMoveButtonTouchStart(event: TouchEvent, task: Task): void {
    event.preventDefault();
    event.stopPropagation();
    // On touch devices, directly trigger the move action
    const button = event.currentTarget as HTMLElement;
    this.overlayPosition = this.mobileService.calculateOverlayPosition(button);
    this.selectedTaskForMove = task;
    this.showMobileMoveOverlay = true;
  }
  /**
   * Gets current column of selected task.
   * @param task - Task to check
   * @param taskArrays - Object containing all task arrays
   * @returns Current column or null
   */
  getCurrentTaskColumn(task: Task | null, taskArrays: {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  }): TaskColumn | null {
    if (!task) return null;
    return this.mobileService.getCurrentTaskColumn(task, taskArrays);
  }
  /**
   * Gets previous column in workflow.
   * @param currentColumn - Current column
   * @returns Previous column or null
   */
  getPreviousColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    if (!currentColumn) return null;
    return this.mobileService.getPreviousColumn(currentColumn);
  }
  /**
   * Gets next column in workflow.
   * @param currentColumn - Current column
   * @returns Next column or null
   */
  getNextColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    if (!currentColumn) return null;
    return this.mobileService.getNextColumn(currentColumn);
  }
  /**
   * Moves selected task to previous column.
   * @param taskArrays - Object containing all task arrays
   * @param updateCallback - Callback to update arrays after move
   */
  moveTaskToPreviousColumn(
    taskArrays: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    updateCallback: (task: Task, fromColumn: TaskColumn | null, toColumn: TaskColumn) => void
  ): void {
    if (!this.selectedTaskForMove) return;
    const currentColumn = this.getCurrentTaskColumn(this.selectedTaskForMove, taskArrays);
    const previousColumn = this.getPreviousColumn(currentColumn);
    if (previousColumn) {
      this.moveTaskToColumn(this.selectedTaskForMove, previousColumn, currentColumn, updateCallback);
    }
  }
  /**
   * Moves selected task to next column.
   * @param taskArrays - Object containing all task arrays
   * @param updateCallback - Callback to update arrays after move
   */
  moveTaskToNextColumn(
    taskArrays: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    updateCallback: (task: Task, fromColumn: TaskColumn | null, toColumn: TaskColumn) => void
  ): void {
    if (!this.selectedTaskForMove) return;
    const currentColumn = this.getCurrentTaskColumn(this.selectedTaskForMove, taskArrays);
    const nextColumn = this.getNextColumn(currentColumn);
    if (nextColumn) {
      this.moveTaskToColumn(this.selectedTaskForMove, nextColumn, currentColumn, updateCallback);
    }
  }
  /**
   * Moves task to specified column.
   * @param task - Task to move
   * @param targetColumn - Target column
   * @param fromColumn - Source column
   * @param updateCallback - Callback to update arrays after move
   */
  private moveTaskToColumn(
    task: Task, 
    targetColumn: TaskColumn, 
    fromColumn: TaskColumn | null,
    updateCallback: (task: Task, fromColumn: TaskColumn | null, toColumn: TaskColumn) => void
  ): void {
    // Update task column
    task.column = targetColumn;
    // Update in Firebase if task has an ID - using same method as drag & drop
    if (task.id) {
      this.taskService.updateTaskInFirebase(task)
        .then(() => {
        })
        .catch((error) => {
          console.error('Mobile task move: Error updating task in Firebase:', error);
          // Revert the column change on Firebase error
          if (fromColumn) {
            task.column = fromColumn;
          }
        });
    }
    // Notify parent component to update arrays
    updateCallback(task, fromColumn, targetColumn);
    // Close overlay
    this.showMobileMoveOverlay = false;
    this.selectedTaskForMove = null;
  }
}

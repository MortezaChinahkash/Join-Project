import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardDragStateService } from './board-drag-state.service';

/**
 * Service for handling Firebase updates during drag and drop operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from BoardDragDropService
 */
@Injectable({ providedIn: 'root' })
export class BoardFirebaseUpdateService {

  constructor(
    private taskService: TaskService,
    private dragState: BoardDragStateService
  ) {}

  /**
   * Processes task column change including Firebase update.
   * Updates the task's column locally and persists to Firebase if column actually changed.
   * 
   * @param oldColumn - The original column of the task
   * @param newColumn - The new column for the task
   * @param onTaskUpdate - Callback to refresh local task arrays
   */
  processTaskColumnChange(oldColumn: TaskColumn, newColumn: TaskColumn, onTaskUpdate: () => void): void {
    if (oldColumn !== newColumn) {
      this.updateTaskColumn(newColumn);
      this.updateTaskInFirebase(oldColumn);
    }
    onTaskUpdate();
  }

  /**
   * Updates the task's column property locally.
   * 
   * @param newColumn - The new column to assign to the task
   * @private
   */
  private updateTaskColumn(newColumn: TaskColumn): void {
    if (this.dragState.draggedTask) {
      this.dragState.draggedTask.column = newColumn;
    }
  }

  /**
   * Persists the task update to Firebase.
   * Includes error handling to revert changes if update fails.
   * 
   * @param oldColumn - The original column to revert to on error
   * @private
   */
  private updateTaskInFirebase(oldColumn: TaskColumn): void {
    if (this.dragState.draggedTask?.id) {
      this.taskService.updateTaskInFirebase(this.dragState.draggedTask)
        .then(() => {
          // Successfully updated in Firebase
        })
        .catch((error) => {
          this.handleFirebaseUpdateError(error, oldColumn);
        });
    }
  }

  /**
   * Handles Firebase update errors by reverting the task's column.
   * Logs the error and restores the original column state.
   * 
   * @param error - The error that occurred during Firebase update
   * @param oldColumn - The original column to revert to
   * @private
   */
  private handleFirebaseUpdateError(error: any, oldColumn: TaskColumn): void {
    console.error('Error updating task in Firebase:', error);
    if (this.dragState.draggedTask) {
      this.dragState.draggedTask.column = oldColumn;
    }
  }
}

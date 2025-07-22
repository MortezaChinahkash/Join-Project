import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';

/**
 * Service for validating drag and drop operations in the board component.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from BoardDragDropService
 */
@Injectable({ providedIn: 'root' })
export class BoardDragValidationService {

  /**
   * Validates if drop operation can proceed.
   * Checks that both dragged task and target column exist.
   * 
   * @param draggedTask - The task being dragged
   * @param dragOverColumn - The column being dragged over
   * @returns true if drop is valid, false otherwise
   */
  validateDropPreconditions(draggedTask: Task | null, dragOverColumn: TaskColumn | null): boolean {
    return !!(draggedTask && dragOverColumn);
  }

  /**
   * Determines if placeholder should be shown during drag operation.
   * Placeholder is shown when dragging over a different column than the task's origin.
   * 
   * @param column - The column being dragged over
   * @param draggedTask - The task being dragged
   * @returns true if placeholder should be shown, false otherwise
   */
  shouldShowPlaceholder(column: TaskColumn | null, draggedTask: Task | null): boolean {
    return !!(column && 
             draggedTask && 
             column !== draggedTask.column);
  }
}

import { Injectable } from '@angular/core';
import { TaskColumn } from '../../interfaces/task.interface';
import { BoardDragStateService } from './board-drag-state.service';

/**
 * Service for handling column-related drag and drop events.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from BoardDragDropService
 */
@Injectable({ providedIn: 'root' })
export class BoardColumnEventService {

  constructor(private dragState: BoardDragStateService) {}

  /**
   * Handles drag over events on columns.
   * Prevents default behavior to allow drop and sets the target column.
   * 
   * @param event - The drag event from the column
   * @param column - The target column being dragged over
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
    this.dragState.setDragOverColumn(column);
  }

  /**
   * Handles drag leave events on columns.
   * Clears the drag over column when leaving the column boundaries.
   * Only clears if the related target is not a child of the current column.
   * 
   * @param event - The drag event from the column
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
   * Prevents default behavior and sets the drop target column if a task is being dragged.
   * 
   * @param event - The drag event from the column
   * @param column - The target column where the drop occurred
   */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
    if (this.dragState.draggedTask) {
      this.dragState.setDragOverColumn(column);
    }
  }
}

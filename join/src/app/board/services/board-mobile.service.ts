import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
/**
 * Service for managing mobile task movement functionality.
 * Handles column navigation and task positioning on mobile devices.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardMobileService {
  /**
   * Calculates the optimal position for the mobile move overlay.
   * 
   * @param button - The button element that triggered the overlay
   * @returns Position object with top and right coordinates
   */
  calculateOverlayPosition(button: HTMLElement): { top: number; right: number } {
    const buttonRect = button.getBoundingClientRect();
    const overlayWidth = 180;
    const gapSize = 8;
    const position = this.getInitialPosition(buttonRect, overlayWidth, gapSize);
    return this.adjustPositionForViewport(position, overlayWidth);
  }
  /**
   * Gets the initial position based on button location.
   * 
   * @param buttonRect - Button's bounding rectangle
   * @param overlayWidth - Width of the overlay
   * @param gapSize - Gap between button and overlay
   * @returns Initial position object
   */
  private getInitialPosition(
    buttonRect: DOMRect, 
    overlayWidth: number, 
    gapSize: number
  ): { top: number; right: number } {
    const viewportWidth = window.innerWidth;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const topPosition = buttonRect.bottom + scrollY + gapSize;
    const rightPosition = Math.max(10, viewportWidth - buttonRect.right);
    return { top: topPosition, right: rightPosition };
  }
  /**
   * Adjusts position to ensure overlay stays within viewport bounds.
   * 
   * @param position - Initial position
   * @param overlayWidth - Width of the overlay
   * @returns Adjusted position object
   */
  private adjustPositionForViewport(
    position: { top: number; right: number }, 
    overlayWidth: number
  ): { top: number; right: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const adjustedPosition = { ...position };
    // Adjust horizontal position
    adjustedPosition.right = this.adjustHorizontalPosition(
      adjustedPosition.right, 
      viewportWidth, 
      overlayWidth
    );
    // Adjust vertical position  
    adjustedPosition.top = this.adjustVerticalPosition(
      adjustedPosition.top, 
      viewportHeight, 
      scrollY
    );
    return adjustedPosition;
  }
  /**
   * Adjusts horizontal position to prevent overflow.
   * 
   * @param rightPosition - Current right position
   * @param viewportWidth - Width of viewport
   * @param overlayWidth - Width of overlay
   * @returns Adjusted right position
   */
  private adjustHorizontalPosition(
    rightPosition: number, 
    viewportWidth: number, 
    overlayWidth: number
  ): number {
    if (rightPosition > viewportWidth - overlayWidth - 10) {
      return 10; // 10px margin from left edge
    }
    return rightPosition;
  }
  /**
   * Adjusts vertical position to prevent overflow.
   * 
   * @param topPosition - Current top position
   * @param viewportHeight - Height of viewport
   * @param scrollY - Current scroll position
   * @returns Adjusted top position
   */
  private adjustVerticalPosition(
    topPosition: number, 
    viewportHeight: number, 
    scrollY: number
  ): number {
    const overlayHeight = 120;
    const minTopMargin = 10;
    if (topPosition + overlayHeight > scrollY + viewportHeight - 20) {
      return Math.max(scrollY + minTopMargin, topPosition - overlayHeight - 8);
    }
    return Math.max(scrollY + minTopMargin, topPosition);
  }
  /**
   * Gets the previous column in the workflow order.
   * 
   * @param currentColumn - Current task column
   * @returns Previous column or null if at beginning
   */
  getPreviousColumn(currentColumn: TaskColumn): TaskColumn | null {
    const columnOrder: TaskColumn[] = ['todo', 'inprogress', 'awaiting', 'done'];
    const currentIndex = columnOrder.indexOf(currentColumn);
    return this.getColumnAtIndex(columnOrder, currentIndex - 1);
  }
  /**
   * Gets the next column in the workflow order.
   * 
   * @param currentColumn - Current task column
   * @returns Next column or null if at end
   */
  getNextColumn(currentColumn: TaskColumn): TaskColumn | null {
    const columnOrder: TaskColumn[] = ['todo', 'inprogress', 'awaiting', 'done'];
    const currentIndex = columnOrder.indexOf(currentColumn);
    return this.getColumnAtIndex(columnOrder, currentIndex + 1);
  }
  /**
   * Safely gets column at specified index.
   * 
   * @param columnOrder - Array of columns in order
   * @param index - Index to retrieve
   * @returns Column at index or null if out of bounds
   */
  private getColumnAtIndex(columnOrder: TaskColumn[], index: number): TaskColumn | null {
    if (index >= 0 && index < columnOrder.length) {
      return columnOrder[index];
    }
    return null;
  }
  /**
   * Gets the display name for a column.
   * 
   * @param column - Column identifier
   * @returns Human-readable column name
   */
  getColumnDisplayName(column: TaskColumn): string {
    const columnMap: Record<TaskColumn, string> = {
      todo: 'To Do',
      inprogress: 'In Progress',
      awaiting: 'Awaiting Feedback',
      done: 'Done'
    };
    return columnMap[column];
  }
  /**
   * Finds the current column of a task from column arrays.
   * 
   * @param task - Task to find
   * @param columnArrays - Object containing all column arrays
   * @returns Current column or null if not found
   */
  getCurrentTaskColumn(
    task: Task, 
    columnArrays: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    }
  ): TaskColumn | null {
    if (columnArrays.todoTasks.some(t => t.id === task.id)) return 'todo';
    if (columnArrays.inProgressTasks.some(t => t.id === task.id)) return 'inprogress';
    if (columnArrays.awaitingFeedbackTasks.some(t => t.id === task.id)) return 'awaiting';
    if (columnArrays.doneTasks.some(t => t.id === task.id)) return 'done';
    return null;
  }
}

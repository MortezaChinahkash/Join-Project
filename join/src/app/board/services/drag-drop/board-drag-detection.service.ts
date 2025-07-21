import { Injectable } from '@angular/core';
import { TaskColumn } from '../../../interfaces/task.interface';
/**
 * Service for detecting drag target columns using various detection methods.
 * Handles column detection for drag and drop operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragDetectionService {
  /**
   * Detects which column is at the given position using multiple detection methods.
   * Uses elementsFromPoint as primary method with geometric bounds as fallback.
   * 
   * @param clientX - X coordinate to check
   * @param clientY - Y coordinate to check
   * @returns TaskColumn at position or null if none found
   */
  getColumnAtPosition(clientX: number, clientY: number): TaskColumn | null {
    // Primary method: Check which column we're over using elementFromPoint
    const elements = document.elementsFromPoint(clientX, clientY);
    let targetColumn: TaskColumn | null = null;
    for (const element of elements) {
      targetColumn = this.checkElementForColumn(element);
      if (targetColumn) break;
    }
    // Fallback method: Use geometric bounds detection if primary method fails
    if (!targetColumn) {
      targetColumn = this.getColumnByGeometricBounds(clientX, clientY);
    }
    return targetColumn;
  }

  /**
   * Checks if an element or its parents represent a board column.
   * 
   * @param element - Element to check
   * @returns TaskColumn if found, null otherwise
   * @private
   */
  private checkElementForColumn(element: Element): TaskColumn | null {
    // Check for board-column element (main column container)
    const columnElement = element.closest('.board-column') as HTMLElement;
    if (columnElement) {
      return columnElement.getAttribute('data-column') as TaskColumn;
    }
    // Check for task-list element as fallback
    const taskListElement = element.closest('.task-list') as HTMLElement;
    if (taskListElement) {
      const parentColumn = taskListElement.closest('.board-column') as HTMLElement;
      if (parentColumn) {
        return parentColumn.getAttribute('data-column') as TaskColumn;
      }
    }
    // Check for column-header as additional fallback
    const headerElement = element.closest('.column-header') as HTMLElement;
    if (headerElement) {
      const parentColumn = headerElement.closest('.board-column') as HTMLElement;
      if (parentColumn) {
        return parentColumn.getAttribute('data-column') as TaskColumn;
      }
    }
    return null;
  }

  /**
   * Enhanced column detection method using geometric bounds as fallback.
   * Iterates through all board columns and checks if the cursor position is within column boundaries.
   * 
   * @param clientX - The X coordinate to check
   * @param clientY - The Y coordinate to check
   * @returns The TaskColumn at the given position, or null if none found
   * @private
   */
  private getColumnByGeometricBounds(clientX: number, clientY: number): TaskColumn | null {
    // Get all board columns
    const columns = document.querySelectorAll('.board-column') as NodeListOf<HTMLElement>;
    for (const column of columns) {
      const rect = column.getBoundingClientRect();
      // Check if the cursor is within the column bounds
      if (clientX >= rect.left && 
          clientX <= rect.right && 
          clientY >= rect.top && 
          clientY <= rect.bottom) {
        return column.getAttribute('data-column') as TaskColumn;
      }
    }
    return null;
  }

  /**
   * Validates if a column is a valid drop target.
   * 
   * @param column - Column to validate
   * @param currentTaskColumn - Current column of the dragged task
   * @returns True if column is a valid drop target
   */
  isValidDropTarget(column: TaskColumn | null, currentTaskColumn: TaskColumn): boolean {
    if (!column) return false;
    return column !== currentTaskColumn;
  }

  /**
   * Gets all available board columns in the DOM.
   * 
   * @returns Array of column elements
   */
  getAllBoardColumns(): HTMLElement[] {
    const columns = document.querySelectorAll('.board-column') as NodeListOf<HTMLElement>;
    return Array.from(columns);
  }

  /**
   * Finds the closest column to a given position.
   * Useful when exact position detection fails.
   * 
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @returns Closest column or null
   */
  findClosestColumn(clientX: number, clientY: number): TaskColumn | null {
    const columns = this.getAllBoardColumns();
    let closestColumn: HTMLElement | null = null;
    let minDistance = Infinity;
    columns.forEach(column => {
      const rect = column.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestColumn = column;
      }
    });
    if (closestColumn) {
      const element = closestColumn as HTMLElement;
      return element.getAttribute('data-column') as TaskColumn;
    }
    return null;
  }
}

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
    const elements = document.elementsFromPoint(clientX, clientY);
    let targetColumn: TaskColumn | null = null;
    for (const element of elements) {
      targetColumn = this.checkElementForColumn(element);
      if (targetColumn) break;
    }
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
    const directColumn = this.checkDirectColumn(element);
    if (directColumn) return directColumn;
    
    const taskListColumn = this.checkTaskListColumn(element);
    if (taskListColumn) return taskListColumn;
    
    const headerColumn = this.checkHeaderColumn(element);
    return headerColumn;
  }

  /**
   * Checks if element is directly a board column.
   * 
   * @param element - Element to check
   * @returns TaskColumn if found, null otherwise
   * @private
   */
  private checkDirectColumn(element: Element): TaskColumn | null {
    const columnElement = element.closest('.board-column') as HTMLElement;
    if (columnElement) {
      return columnElement.getAttribute('data-column') as TaskColumn;
    }
    return null;
  }

  /**
   * Checks if element is within a task list and finds its parent column.
   * 
   * @param element - Element to check
   * @returns TaskColumn if found, null otherwise
   * @private
   */
  private checkTaskListColumn(element: Element): TaskColumn | null {
    const taskListElement = element.closest('.task-list') as HTMLElement;
    if (taskListElement) {
      const parentColumn = taskListElement.closest('.board-column') as HTMLElement;
      if (parentColumn) {
        return parentColumn.getAttribute('data-column') as TaskColumn;
      }
    }
    return null;
  }

  /**
   * Checks if element is within a column header and finds its parent column.
   * 
   * @param element - Element to check
   * @returns TaskColumn if found, null otherwise
   * @private
   */
  private checkHeaderColumn(element: Element): TaskColumn | null {
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
    const columns = document.querySelectorAll('.board-column') as NodeListOf<HTMLElement>;
    for (const column of columns) {
      const rect = column.getBoundingClientRect();
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
    const closestColumn = this.findColumnWithMinDistance(columns, clientX, clientY);
    return this.extractColumnFromElement(closestColumn);
  }

  /**
   * Finds the column element with minimum distance to the given coordinates.
   * 
   * @param columns - Array of column elements
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @returns Closest column element or null
   * @private
   */
  private findColumnWithMinDistance(columns: HTMLElement[], clientX: number, clientY: number): HTMLElement | null {
    let closestColumn: HTMLElement | null = null;
    let minDistance = Infinity;
    
    columns.forEach(column => {
      const distance = this.calculateDistanceToColumn(column, clientX, clientY);
      if (distance < minDistance) {
        minDistance = distance;
        closestColumn = column;
      }
    });
    
    return closestColumn;
  }

  /**
   * Calculates the distance from coordinates to column center.
   * 
   * @param column - Column element
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @returns Distance to column center
   * @private
   */
  private calculateDistanceToColumn(column: HTMLElement, clientX: number, clientY: number): number {
    const rect = column.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.sqrt(
      Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
    );
  }

  /**
   * Extracts the TaskColumn from an HTML element.
   * 
   * @param element - Column element or null
   * @returns TaskColumn or null
   * @private
   */
  private extractColumnFromElement(element: HTMLElement | null): TaskColumn | null {
    if (element) {
      return element.getAttribute('data-column') as TaskColumn;
    }
    return null;
  }
}

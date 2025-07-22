import { Injectable } from '@angular/core';
import { TaskColumn } from '../../interfaces/task.interface';

/**
 * Service for detecting column positions during drag and drop operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from BoardDragDropService
 */
@Injectable({ providedIn: 'root' })
export class BoardColumnDetectionService {

  /**
   * Determines which column is at the given position by examining DOM elements.
   * Uses elementsFromPoint to find board columns or task lists at the specified coordinates.
   * 
   * @param clientX - X coordinate on the screen
   * @param clientY - Y coordinate on the screen
   * @returns The TaskColumn at the position, or null if no valid column is found
   */
  getColumnAtPosition(clientX: number, clientY: number): TaskColumn | null {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const element of elements) {
      if (element.classList.contains('board-column') || element.classList.contains('task-list')) {
        const columnId = element.getAttribute('data-column') || 
                        element.closest('[data-column]')?.getAttribute('data-column');
        switch (columnId) {
          case 'todo': return 'todo';
          case 'inprogress': return 'inprogress';
          case 'awaiting': return 'awaiting';
          case 'done': return 'done';
        }
      }
    }
    return null;
  }
}

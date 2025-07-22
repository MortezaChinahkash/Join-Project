import { Injectable } from '@angular/core';

/**
 * Service for DOM calculations related to drag and drop operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from BoardDragDropService
 */
@Injectable({ providedIn: 'root' })
export class BoardDragCalculationService {

  /**
   * Calculates the height for the drag placeholder based on the dragged task element.
   * Falls back to default height if no task element is found.
   * 
   * @returns The calculated placeholder height in pixels
   */
  calculatePlaceholderHeight(): number {
    const taskElement = document.querySelector('.task-card[style*="opacity: 0.5"]') as HTMLElement;
    return taskElement ? taskElement.offsetHeight : 80;
  }
}

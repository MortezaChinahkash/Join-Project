import { Injectable } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { BoardDragStateService } from './board-drag-state.service';

/**
 * Service for creating and managing visual drag elements during drag and drop operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from BoardDragDropService
 */
@Injectable({ providedIn: 'root' })
export class BoardDragElementService {

  constructor(private dragState: BoardDragStateService) {}

  /**
   * Creates visual drag element by cloning the original task element.
   * Applies styling for drag feedback and positions it at the cursor.
   * 
   * @param task - Task being dragged
   * @param originalElement - Original task element from the DOM
   * @param clientX - Current X position of the cursor
   * @param clientY - Current Y position of the cursor
   */
  createDragElement(task: Task, originalElement: HTMLElement, clientX: number, clientY: number): void {
    const taskElement = originalElement.closest('.task-card') as HTMLElement;
    if (!taskElement) return;
    
    const originalRect = taskElement.getBoundingClientRect();
    const dragElement = this.cloneAndStyleDragElement(taskElement);
    document.body.appendChild(dragElement);
    this.initializeDragElementPosition(dragElement, originalRect, clientX, clientY);
  }

  /**
   * Clones the task element and applies drag-specific styling.
   * 
   * @param taskElement - The original task element to clone
   * @returns The cloned and styled drag element
   * @private
   */
  private cloneAndStyleDragElement(taskElement: HTMLElement): HTMLElement {
    const dragElement = taskElement.cloneNode(true) as HTMLElement;
    this.applyDragElementStyles(dragElement, taskElement);
    return dragElement;
  }

  /**
   * Applies visual styling to make the drag element look like it's being dragged.
   * Includes rotation, shadow, opacity, and positioning styles.
   * 
   * @param dragElement - The cloned element to style
   * @param taskElement - The original element for size reference
   * @private
   */
  private applyDragElementStyles(dragElement: HTMLElement, taskElement: HTMLElement): void {
    dragElement.style.position = 'fixed';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.zIndex = '10000';
    dragElement.style.transform = 'rotate(2deg)';
    dragElement.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
    dragElement.style.opacity = '0.95';
    dragElement.style.width = `${taskElement.offsetWidth}px`;
    dragElement.style.height = `${taskElement.offsetHeight}px`;
  }

  /**
   * Positions the drag element relative to the cursor position.
   * Calculates offset from cursor to element corner for natural dragging feel.
   * 
   * @param dragElement - The drag element to position
   * @param originalRect - The bounding rect of the original element
   * @param clientX - Current X position of the cursor
   * @param clientY - Current Y position of the cursor
   * @private
   */
  private initializeDragElementPosition(dragElement: HTMLElement, originalRect: DOMRect, clientX: number, clientY: number): void {
    const offsetX = clientX - originalRect.left;
    const offsetY = clientY - originalRect.top;
    this.dragState.setDragElementWithOffset(dragElement, offsetX, offsetY);
    this.dragState.updateDragPosition(clientX, clientY);
  }
}

import { Injectable } from '@angular/core';
import { BoardDragStateService } from './board-drag-state.service';
import { BoardAutoScrollService } from './board-auto-scroll.service';

/**
 * Service for cleaning up DOM elements and visual states after drag operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0 - Initial extraction from BoardDragDropService
 */
@Injectable({ providedIn: 'root' })
export class BoardDragCleanupService {

  constructor(
    private dragState: BoardDragStateService,
    private autoScroll: BoardAutoScrollService
  ) {}

  /**
   * Performs complete cleanup after a drag operation finishes.
   * Removes drag elements, restores opacity, cleans up state, and stops auto-scroll.
   * 
   * @param onTaskUpdate - Callback to update task arrays after drop
   * @param shouldHandleDrop - Whether to process the drop if valid conditions are met
   * @param dropHandler - Function to handle the actual drop logic
   */
  finishTaskDragCleanup(onTaskUpdate: () => void, shouldHandleDrop: boolean, dropHandler?: () => void): void {
    this.removeDragElement();
    this.restoreTaskCardOpacity();
    
    if (shouldHandleDrop && dropHandler && this.dragState.dragOverColumn && this.dragState.draggedTask) {
      dropHandler();
    }
    
    this.resetDragState();
    this.stopAutoScroll();
  }

  /**
   * Removes the visual drag element from the DOM.
   * @private
   */
  private removeDragElement(): void {
    if (this.dragState.dragElement) {
      this.dragState.dragElement.remove();
    }
  }

  /**
   * Restores the opacity of all task cards to their normal state.
   * @private
   */
  private restoreTaskCardOpacity(): void {
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
      (card as HTMLElement).style.opacity = '';
    });
  }

  /**
   * Resets all drag-related state and placeholder.
   * @private
   */
  private resetDragState(): void {
    this.dragState.setPlaceholder(false, 0);
    this.dragState.resetDragState();
  }

  /**
   * Stops auto-scroll functionality.
   * @private
   */
  private stopAutoScroll(): void {
    this.autoScroll.stopAutoScroll();
  }
}

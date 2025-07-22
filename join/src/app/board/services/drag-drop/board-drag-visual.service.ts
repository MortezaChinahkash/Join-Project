import { Injectable } from '@angular/core';
import { Task } from '../../../interfaces/task.interface';
import { BoardDragStateService } from './board-drag-state.service';

/**
 * Service for handling visual aspects of drag operations.
 * Manages drag element creation, styling, and cleanup.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragVisualService {

  constructor(private dragState: BoardDragStateService) {}

  /**
   * Public method to start drag visualization
   */
  startDragVisualization(taskCard: HTMLElement, clientX: number, clientY: number): void {
    this.enableDragOverflow();
    this.createAndConfigureDragElement(taskCard, clientX, clientY);
  }

  /**
   * Public method to end drag visualization
   */
  endDragVisualization(): void {
    this.disableDragOverflow();
    this.cleanupDragElement();
  }

  /**
   * Cleans up the drag element and removes styling
   */
  cleanupDragElement(): void {
    if (this.dragState.dragElement) {
      document.body.removeChild(this.dragState.dragElement);
    }
    const draggingElements = document.querySelectorAll('.task-dragging-original');
    draggingElements.forEach(el => el.classList.remove('task-dragging-original'));
  }

  /**
   * Initiates the task dragging process by creating a visual clone and setting up drag state.
   */
  startTaskDrag(clientX: number, clientY: number, task: Task, element: HTMLElement): void {
    this.initializeDragState(task, clientX, clientY);
    this.enableDragOverflow();
    const taskCard = element.closest('.task-card') as HTMLElement;
    if (taskCard) {
      this.createAndConfigureDragElement(taskCard, clientX, clientY);
    }
  }

  /**
   * Updates the position of the dragged task element.
   */
  updateDragElementPosition(clientX: number, clientY: number): void {
    if (!this.dragState.isDraggingTask || !this.dragState.dragElement) return;
    this.dragState.updateDragElementPosition(clientX, clientY);
  }

  /**
   * Cleans up drag operation and resets state.
   */
  cleanup(): void {
    if (this.dragState.dragElement) {
      document.body.removeChild(this.dragState.dragElement);
    }
    const draggingElements = document.querySelectorAll('.task-dragging-original');
    draggingElements.forEach(el => el.classList.remove('task-dragging-original'));
    this.resetDragState();
  }

  /**
   * Resets all drag & drop state variables.
   */
  resetDragState(): void {
    this.dragState.resetDragState();
    this.disableDragOverflow();
  }

  /**
   * Initializes the basic drag state properties.
   */
  private initializeDragState(task: Task, clientX: number, clientY: number): void {
    this.dragState.draggedTask = task;
    this.dragState.isDraggingTask = true;
    this.dragState.dragStartPosition = { x: clientX, y: clientY };
  }

  /**
   * Creates and configures the visual drag element.
   */
  private createAndConfigureDragElement(taskCard: HTMLElement, clientX: number, clientY: number): void {
    this.dragState.dragElement = taskCard.cloneNode(true) as HTMLElement;
    this.configureDragElementStyles(taskCard);
    this.calculateDragOffset(taskCard, clientX, clientY);
    this.finalizeDragElement(taskCard);
  }

  /**
   * Configures the visual styles for the drag element.
   */
  private configureDragElementStyles(taskCard: HTMLElement): void {
    const dragElement = this.dragState.dragElement!;
    dragElement.style.position = 'fixed';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.zIndex = '9999';
    dragElement.style.transform = 'rotate(5deg)';
    dragElement.style.transition = 'none';
    dragElement.style.width = taskCard.offsetWidth + 'px';
    dragElement.style.height = taskCard.offsetHeight + 'px';
    dragElement.classList.add('task-dragging');
  }

  /**
   * Calculates and sets the drag offset from cursor to element.
   */
  private calculateDragOffset(taskCard: HTMLElement, clientX: number, clientY: number): void {
    const rect = taskCard.getBoundingClientRect();
    this.dragState.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    this.dragState.updateDragElementPosition(clientX, clientY);
  }

  /**
   * Finalizes the drag element setup and adds it to the DOM.
   */
  private finalizeDragElement(taskCard: HTMLElement): void {
    document.body.appendChild(this.dragState.dragElement!);
    taskCard.classList.add('task-dragging-original');
    this.dragState.dragPlaceholderHeight = taskCard.offsetHeight;
  }

  /**
   * Enables drag overflow for the main content area.
   */
  private enableDragOverflow(): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.overflowX = 'visible';
    }
  }

  /**
   * Disables drag overflow for the main content area.
   */
  private disableDragOverflow(): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.overflowX = 'auto';
    }
  }
}

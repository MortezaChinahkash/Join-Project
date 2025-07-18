import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../../interfaces/task.interface';

/**
 * Service for managing overlay states and task selection.
 * Handles overlay visibility, task editing states, and navigation.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardFormOverlayService {
  
  // Overlay states
  showAddTaskOverlay = false;
  showTaskDetailsOverlay = false;
  showTaskEditOverlay = false;
  showDeleteConfirmationOverlay = false;
  
  // Task states
  selectedTask: Task | null = null;
  isEditingTask = false;
  currentColumn: TaskColumn = 'todo';
  
  // Animation states
  private overlayAnimationTimeout?: any;

  /**
   * Opens the add task overlay for a specific column.
   * 
   * @param column - Column where task will be added
   */
  openAddTaskOverlay(column: TaskColumn = 'todo'): void {
    this.closeAllOverlays();
    this.currentColumn = column;
    this.showAddTaskOverlay = true;
  }

  /**
   * Opens the task details overlay for viewing a task.
   * 
   * @param task - Task to display details for
   */
  openTaskDetailsOverlay(task: Task): void {
    this.closeAllOverlays();
    this.selectedTask = task;
    this.showTaskDetailsOverlay = true;
    this.isEditingTask = false;
  }

  /**
   * Opens the task edit overlay for editing a task.
   * 
   * @param task - Task to edit
   */
  openTaskEditOverlay(task: Task): void {
    this.closeAllOverlays();
    this.selectedTask = task;
    this.showTaskEditOverlay = true;
    this.isEditingTask = true;
  }

  /**
   * Opens the delete confirmation overlay.
   * 
   * @param task - Task to potentially delete
   */
  openDeleteConfirmationOverlay(task: Task): void {
    this.selectedTask = task;
    this.showDeleteConfirmationOverlay = true;
  }

  /**
   * Closes all overlays and resets states.
   */
  closeAllOverlays(): void {
    this.showAddTaskOverlay = false;
    this.showTaskDetailsOverlay = false;
    this.showTaskEditOverlay = false;
    this.showDeleteConfirmationOverlay = false;
    this.selectedTask = null;
    this.isEditingTask = false;
    
    if (this.overlayAnimationTimeout) {
      clearTimeout(this.overlayAnimationTimeout);
    }
  }

  /**
   * Closes overlays with animation delay.
   * 
   * @param delay - Animation delay in milliseconds
   */
  closeOverlaysWithAnimation(delay: number = 300): Promise<void> {
    return new Promise(resolve => {
      this.overlayAnimationTimeout = setTimeout(() => {
        this.closeAllOverlays();
        resolve();
      }, delay);
    });
  }

  /**
   * Switches from details view to edit view.
   */
  switchToEditMode(): void {
    if (this.selectedTask) {
      this.showTaskDetailsOverlay = false;
      this.showTaskEditOverlay = true;
      this.isEditingTask = true;
    }
  }

  /**
   * Switches from edit view to details view.
   */
  switchToDetailsMode(): void {
    if (this.selectedTask) {
      this.showTaskEditOverlay = false;
      this.showTaskDetailsOverlay = true;
      this.isEditingTask = false;
    }
  }

  /**
   * Gets the currently active overlay type.
   * 
   * @returns Active overlay name or null
   */
  getActiveOverlay(): string | null {
    if (this.showAddTaskOverlay) return 'add-task';
    if (this.showTaskDetailsOverlay) return 'task-details';
    if (this.showTaskEditOverlay) return 'task-edit';
    if (this.showDeleteConfirmationOverlay) return 'delete-confirmation';
    return null;
  }

  /**
   * Checks if any overlay is currently open.
   * 
   * @returns True if any overlay is open
   */
  isAnyOverlayOpen(): boolean {
    return this.showAddTaskOverlay || 
           this.showTaskDetailsOverlay || 
           this.showTaskEditOverlay || 
           this.showDeleteConfirmationOverlay;
  }

  /**
   * Handles escape key press to close overlays.
   */
  handleEscapeKey(): void {
    if (this.isAnyOverlayOpen()) {
      this.closeAllOverlays();
    }
  }

  /**
   * Handles backdrop click to close overlays.
   * 
   * @param event - Click event
   */
  handleBackdropClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('overlay-backdrop')) {
      this.closeAllOverlays();
    }
  }

  /**
   * Sets the current column for task operations.
   * 
   * @param column - Column to set as current
   */
  setCurrentColumn(column: TaskColumn): void {
    this.currentColumn = column;
  }

  /**
   * Gets the current column.
   * 
   * @returns Current column
   */
  getCurrentColumn(): TaskColumn {
    return this.currentColumn;
  }

  /**
   * Checks if a task is currently selected.
   * 
   * @returns True if a task is selected
   */
  hasSelectedTask(): boolean {
    return this.selectedTask !== null;
  }

  /**
   * Gets the selected task.
   * 
   * @returns Selected task or null
   */
  getSelectedTask(): Task | null {
    return this.selectedTask;
  }

  /**
   * Clears the selected task.
   */
  clearSelectedTask(): void {
    this.selectedTask = null;
    this.isEditingTask = false;
  }

  /**
   * Checks if currently in edit mode.
   * 
   * @returns True if editing a task
   */
  isInEditMode(): boolean {
    return this.isEditingTask;
  }

  /**
   * Cleanup method for service destruction.
   */
  cleanup(): void {
    this.closeAllOverlays();
    if (this.overlayAnimationTimeout) {
      clearTimeout(this.overlayAnimationTimeout);
    }
  }
}

import { Injectable } from '@angular/core';
import { TaskColumn } from '../../../interfaces/task.interface';
/**
 * Service for managing task form overlay states and visibility.
 * Handles overlay opening, closing, and state management.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardFormOverlayService {
  showAddTaskOverlay = false;
  showTaskDetailsOverlay = false;
  isEditingTask = false;
  currentColumn: TaskColumn = 'todo';
  /**
   * Opens the add task overlay for a specific column.
   * 
   * @param column - The column where the new task should be created (defaults to 'todo')
   */
  openAddTaskOverlay(column: TaskColumn = 'todo'): void {
    this.showAddTaskOverlay = true;
    this.currentColumn = column;
  }
  /**
   * Closes the add task overlay and resets overlay state.
   */
  closeAddTaskOverlay(): void {
    this.showAddTaskOverlay = false;
  }
  /**
   * Opens the task details overlay.
   */
  openTaskDetailsOverlay(): void {
    this.showTaskDetailsOverlay = true;
  }
  /**
   * Closes the task details overlay and resets editing state.
   */
  closeTaskDetailsOverlay(): void {
    this.showTaskDetailsOverlay = false;
    this.isEditingTask = false;
  }
  /**
   * Starts editing mode for a task.
   */
  startEditingTask(): void {
    this.isEditingTask = true;
  }
  /**
   * Cancels editing mode for a task.
   */
  cancelEditingTask(): void {
    this.isEditingTask = false;
  }
  /**
   * Checks if any overlay is currently open.
   * 
   * @returns True if any overlay is open
   */
  isAnyOverlayOpen(): boolean {
    return this.showAddTaskOverlay || this.showTaskDetailsOverlay;
  }
  /**
   * Closes all overlays and resets all states.
   */
  closeAllOverlays(): void {
    this.showAddTaskOverlay = false;
    this.showTaskDetailsOverlay = false;
    this.isEditingTask = false;
  }
  /**
   * Gets the current overlay state as an object.
   * 
   * @returns Object containing all overlay states
   */
  getOverlayState(): {
    showAddTaskOverlay: boolean;
    showTaskDetailsOverlay: boolean;
    isEditingTask: boolean;
    currentColumn: TaskColumn;
  } {
    return {
      showAddTaskOverlay: this.showAddTaskOverlay,
      showTaskDetailsOverlay: this.showTaskDetailsOverlay,
      isEditingTask: this.isEditingTask,
      currentColumn: this.currentColumn
    };
  }
  /**
   * Sets the current column for new task creation.
   * 
   * @param column - Column to set as current
   */
  setCurrentColumn(column: TaskColumn): void {
    this.currentColumn = column;
  }
  /**
   * Gets the current column for new task creation.
   * 
   * @returns Current column
   */
  getCurrentColumn(): TaskColumn {
    return this.currentColumn;
  }
}

import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';

/**
 * Service for managing board component method delegation.
 * Centralizes component methods to reduce main component size.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardMethodDelegationService {

  /**
   * Handles opening task details with specified task.
   * @param task - Task to open details for
   * @param taskEditOverlayService - Service for task edit overlay
   */
  handleOpenTaskDetails(task: Task, taskEditOverlayService: any): void {
    taskEditOverlayService.openTaskDetails(task);
  }

  /**
   * Handles opening add task overlay for specified column.
   * @param column - Target column for new task
   * @param taskManagementService - Service for task management
   */
  handleOpenAddTaskOverlay(column: TaskColumn, taskManagementService: any): void {
    taskManagementService.openAddTaskOverlay(column);
  }

  /**
   * Handles closing task details overlay.
   * @param taskEditOverlayService - Service for task edit overlay
   * @param updateCallback - Callback to update task arrays
   */
  handleCloseTaskDetails(taskEditOverlayService: any, updateCallback: () => void): void {
    taskEditOverlayService.closeTaskDetails();
    updateCallback();
  }

  /**
   * Handles task deletion process.
   * @param task - Task to delete
   * @param taskManagementService - Service for task management
   * @param updateCallback - Callback to update task arrays
   */
  async handleDeleteTask(task: Task, taskManagementService: any, updateCallback: () => void): Promise<void> {
    await taskManagementService.deleteTask(task);
    updateCallback();
  }

  /**
   * Handles task saving process.
   * @param task - Task to save
   * @param taskManagementService - Service for task management
   * @param updateCallback - Callback to update task arrays
   */
  async handleSaveTask(task: Task, taskManagementService: any, updateCallback: () => void): Promise<void> {
    await taskManagementService.saveTaskChanges(updateCallback);
  }

  /**
   * Handles column drag over events.
   * @param event - Drag event
   * @param column - Target column
   * @param interactionService - Service for board interactions
   */
  handleColumnDragOver(event: DragEvent, column: TaskColumn, interactionService: any): void {
    interactionService.handleColumnDragOver(event, column);
  }

  /**
   * Handles column drag leave events.
   * @param event - Drag event
   * @param interactionService - Service for board interactions
   */
  handleColumnDragLeave(event: DragEvent, interactionService: any): void {
    interactionService.handleColumnDragLeave(event);
  }

  /**
   * Handles column drop events.
   * @param event - Drop event
   * @param column - Target column
   * @param interactionService - Service for board interactions
   * @param updateCallback - Callback to update task arrays
   */
  async handleColumnDrop(event: DragEvent, column: TaskColumn, interactionService: any, updateCallback: () => void): Promise<void> {
    await interactionService.handleColumnDrop(event, column, updateCallback);
  }
}

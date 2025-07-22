import { Injectable } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from './task.service';
/**
 * Service for handling delete confirmation operations.
 * Manages the state and logic for task deletion confirmation.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class DeleteConfirmationService {
  /**
   * Whether the delete confirmation overlay is visible
   */
  showDeleteConfirmationOverlay = false;
  /**
   * The task that is marked for deletion
   */
  taskToDelete: Task | null = null;
  constructor(private taskService: TaskService) {}

  /**
   * Opens the delete confirmation overlay for the specified task.
   * 
   * @param task - The task to be deleted
   */
  openDeleteConfirmation(task: Task): void {
    this.taskToDelete = task;
    this.showDeleteConfirmationOverlay = true;
  }

  /**
   * Closes the delete confirmation overlay and resets the task to delete.
   */
  closeDeleteConfirmation(): void {
    this.showDeleteConfirmationOverlay = false;
    this.taskToDelete = null;
  }

  /**
   * Confirms and deletes the task after user confirmation.
   * 
   * @param onTaskUpdate - Callback to update local task arrays after successful deletion
   * @returns Promise<void>
   */
  async confirmDeleteTask(onTaskUpdate: () => void): Promise<void> {
    if (!this.taskToDelete || !this.taskToDelete.id) return;
    try {
      await this.taskService.deleteTaskFromFirebase(this.taskToDelete.id);
      onTaskUpdate();
      this.closeDeleteConfirmation();
    } catch (error) {

      console.error('âŒ Error deleting task:', error);
    }
  }

  /**
   * Initiates the delete process by opening the confirmation overlay.
   * 
   * @param task - The task to be deleted
   */
  deleteTask(task: Task): void {
    this.openDeleteConfirmation(task);
  }
}

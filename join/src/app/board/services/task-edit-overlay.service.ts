import { Injectable } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';
import { BoardFormService } from './board-form.service';
/**
 * Service for handling task edit overlay operations.
 * Manages the state and logic for task editing functionality.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class TaskEditOverlayService {
  /**
   * Whether the task edit overlay is visible
   */
  isEditingTask = false;
  /**
   * The task that is being edited
   */
  selectedTask: Task | null = null;
  constructor(private formService: BoardFormService) {}

  /**
   * Opens the task edit overlay for the specified task.
   * 
   * @param task - The task to be edited
   * @param contacts - Array of available contacts
   */
  openEditOverlay(task: Task, contacts: Contact[]): void {
    this.selectedTask = task;
    this.isEditingTask = true;
    this.formService.editTask(contacts);
  }

  /**
   * Closes the task edit overlay and resets the editing state.
   */
  closeEditOverlay(): void {
    this.isEditingTask = false;
    this.selectedTask = null;
    this.formService.cancelEditTask();
  }

  /**
   * Saves the task changes and closes the overlay.
   * 
   * @param onTaskUpdate - Callback to update local task arrays after successful save
   * @returns Promise<void>
   */
  async saveTaskChanges(onTaskUpdate: () => void): Promise<void> {
    try {
      await this.formService.saveTaskChanges(onTaskUpdate);
      // Note: The overlay will be closed by the form service after successful save
    } catch (error) {

      console.error('âŒ Error saving task changes:', error);
    }
  }

  /**
   * Gets the current editing state
   */
  getEditingState(): boolean {
    return this.isEditingTask && this.formService.isEditingTask;
  }

  /**
   * Gets the currently selected task
   */
  getSelectedTask(): Task | null {
    return this.selectedTask || this.formService.selectedTask;
  }
}

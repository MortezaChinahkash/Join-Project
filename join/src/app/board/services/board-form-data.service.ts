import { Injectable } from '@angular/core';
import { Task, Subtask } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';
/**
 * Service for managing board form data operations.
 * Handles task creation, updates, data persistence, and state management.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardFormDataService {
  // Data state
  private currentTask: Task | null = null;
  private originalTask: Task | null = null;
  private isEditMode = false;
  // Auto-save configuration
  private autoSaveEnabled = false;
  private autoSaveTimeout: any = null;
  private autoSaveDelay = 1000; // 1 second
  /**
   * Creates a new task object with default values.
   * 
   * @param status - Initial task status
   * @returns New task object
   */
  createNewTask(status: 'todo' | 'inprogress' | 'awaiting' | 'done' = 'todo'): Task {
    const newTask: Task = {
      id: this.generateTaskId(),
      title: '',
      description: '',
      assignedTo: [],
      dueDate: '',
      priority: 'medium',
      column: status,
      subtasks: [],
      category: '',
      createdAt: new Date()
    };
    this.currentTask = newTask;
    this.isEditMode = false;
    this.originalTask = null;
    return newTask;
  }
  /**
   * Initializes form data for editing an existing task.
   * 
   * @param task - Task to edit
   */
  initializeForEdit(task: Task): void {
    this.currentTask = this.deepCloneTask(task);
    this.originalTask = this.deepCloneTask(task);
    this.isEditMode = true;
  }
  /**
   * Gets the current task being edited or created.
   * 
   * @returns Current task or null
   */
  getCurrentTask(): Task | null {
    return this.currentTask;
  }
  /**
   * Gets the original task (before editing).
   * 
   * @returns Original task or null
   */
  getOriginalTask(): Task | null {
    return this.originalTask;
  }
  /**
   * Checks if form is in edit mode.
   * 
   * @returns True if editing existing task
   */
  getIsEditMode(): boolean {
    return this.isEditMode;
  }
  /**
   * Updates a field in the current task.
   * 
   * @param field - Field name to update
   * @param value - New value
   */
  updateTaskField(field: keyof Task, value: any): void {
    if (!this.currentTask) return;
    (this.currentTask as any)[field] = value;
    if (this.autoSaveEnabled) {
      this.scheduleAutoSave();
    }
  }
  /**
   * Updates task title.
   * 
   * @param title - New title
   */
  updateTitle(title: string): void {
    this.updateTaskField('title', title);
  }
  /**
   * Updates task description.
   * 
   * @param description - New description
   */
  updateDescription(description: string): void {
    this.updateTaskField('description', description);
  }
  /**
   * Updates task due date.
   * 
   * @param dueDate - New due date
   */
  updateDueDate(dueDate: string): void {
    this.updateTaskField('dueDate', dueDate);
  }
  /**
   * Updates task priority.
   * 
   * @param priority - New priority
   */
  updatePriority(priority: 'low' | 'medium' | 'urgent'): void {
    this.updateTaskField('priority', priority);
  }
  /**
   * Updates task category.
   * 
   * @param category - New category
   */
  updateCategory(category: string): void {
    this.updateTaskField('category', category);
  }
  /**
   * Updates task status.
   * 
   * @param status - New status
   */
  updateStatus(status: 'todo' | 'inprogress' | 'awaiting' | 'done'): void {
    this.updateTaskField('column', status);
  }
  /**
   * Updates assigned contacts.
   * 
   * @param contacts - Array of assigned contacts
   */
  updateAssignedContacts(contacts: Contact[]): void {
    if (!this.currentTask) return;
    this.currentTask.assignedTo = contacts.map(contact => contact.id || '').filter(id => id);
    if (this.autoSaveEnabled) {
      this.scheduleAutoSave();
    }
  }
  /**
   * Adds a subtask to the current task.
   * 
   * @param title - Subtask title
   * @returns Created subtask
   */
  addSubtask(title: string): Subtask {
    if (!this.currentTask) {
      throw new Error('No current task to add subtask to');
    }
    const subtask: Subtask = {
      id: this.generateSubtaskId(),
      title: title,
      completed: false
    };
    this.currentTask.subtasks.push(subtask);
    if (this.autoSaveEnabled) {
      this.scheduleAutoSave();
    }
    return subtask;
  }
  /**
   * Updates a subtask.
   * 
   * @param subtaskId - ID of subtask to update
   * @param updates - Partial subtask updates
   */
  updateSubtask(subtaskId: string, updates: Partial<Subtask>): void {
    if (!this.currentTask) return;
    const subtaskIndex = this.currentTask.subtasks.findIndex((st: Subtask) => st.id === subtaskId);
    if (subtaskIndex > -1) {
      this.currentTask.subtasks[subtaskIndex] = {
        ...this.currentTask.subtasks[subtaskIndex],
        ...updates
      };
      if (this.autoSaveEnabled) {
        this.scheduleAutoSave();
      }
    }
  }
  /**
   * Removes a subtask from the current task.
   * 
   * @param subtaskId - ID of subtask to remove
   */
  removeSubtask(subtaskId: string): void {
    if (!this.currentTask) return;
    const index = this.currentTask.subtasks.findIndex((st: Subtask) => st.id === subtaskId);
    if (index > -1) {
      this.currentTask.subtasks.splice(index, 1);
      if (this.autoSaveEnabled) {
        this.scheduleAutoSave();
      }
    }
  }
  /**
   * Gets all subtasks for the current task.
   * 
   * @returns Array of subtasks
   */
  getSubtasks(): Subtask[] {
    return this.currentTask?.subtasks || [];
  }
  /**
   * Checks if the current task has been modified.
   * 
   * @returns True if task has changes
   */
  hasChanges(): boolean {
    if (!this.currentTask || !this.originalTask) return false;
    return JSON.stringify(this.currentTask) !== JSON.stringify(this.originalTask);
  }
  /**
   * Reverts changes to the original task state.
   */
  revertChanges(): void {
    if (this.originalTask) {
      this.currentTask = this.deepCloneTask(this.originalTask);
    }
  }
  /**
   * Saves the current task state as the new original.
   */
  saveChanges(): void {
    if (this.currentTask) {
      this.originalTask = this.deepCloneTask(this.currentTask);
    }
  }
  /**
   * Validates the current task data.
   * 
   * @returns Validation result with errors
   */
  validateTaskData(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!this.currentTask) {
      errors.push('No task data available');
      return { isValid: false, errors };
    }
    if (!this.currentTask.title?.trim()) {
      errors.push('Title is required');
    }
    if (!this.currentTask.description?.trim()) {
      errors.push('Description is required');
    }
    if (!this.currentTask.category?.trim()) {
      errors.push('Category is required');
    }
    if (this.currentTask.dueDate) {
      const dueDate = new Date(this.currentTask.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        errors.push('Due date cannot be in the past');
      }
    }
    return { isValid: errors.length === 0, errors };
  }
  /**
   * Enables auto-save functionality.
   * 
   * @param delay - Auto-save delay in milliseconds
   */
  enableAutoSave(delay: number = 1000): void {
    this.autoSaveEnabled = true;
    this.autoSaveDelay = delay;
  }
  /**
   * Disables auto-save functionality.
   */
  disableAutoSave(): void {
    this.autoSaveEnabled = false;
    this.clearAutoSaveTimeout();
  }
  /**
   * Schedules an auto-save operation.
   */
  private scheduleAutoSave(): void {
    this.clearAutoSaveTimeout();
    this.autoSaveTimeout = setTimeout(() => {
      this.performAutoSave();
    }, this.autoSaveDelay);
  }
  /**
   * Clears the auto-save timeout.
   */
  private clearAutoSaveTimeout(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }
  /**
   * Performs the auto-save operation.
   */
  private performAutoSave(): void {
    if (this.currentTask && this.hasChanges()) {
      // Auto-save logic would go here
      // For now, just update the saved state
      this.saveChanges();
    }
  }
  /**
   * Generates a unique task ID.
   * 
   * @returns Unique task ID
   */
  private generateTaskId(): string {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  /**
   * Generates a unique subtask ID.
   * 
   * @returns Unique subtask ID
   */
  private generateSubtaskId(): string {
    return 'subtask_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  /**
   * Creates a deep clone of a task object.
   * 
   * @param task - Task to clone
   * @returns Cloned task
   */
  private deepCloneTask(task: Task): Task {
    return JSON.parse(JSON.stringify(task));
  }
  /**
   * Resets the service state.
   */
  reset(): void {
    this.currentTask = null;
    this.originalTask = null;
    this.isEditMode = false;
    this.disableAutoSave();
  }
  /**
   * Cleanup method to clear timeouts and reset state.
   */
  cleanup(): void {
    this.clearAutoSaveTimeout();
    this.reset();
  }
}

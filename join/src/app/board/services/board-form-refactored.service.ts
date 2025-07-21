import { Injectable } from '@angular/core';
import { Contact } from '../../contacts/services/contact-data.service';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardFormStateService } from './form/board-form-state.service';
import { BoardFormOverlayService } from './form/board-form-overlay.service';
import { BoardFormContactService } from './form/board-form-contact.service';
/**
 * Refactored main service for handling task form operations and overlay management.
 * Orchestrates form operations using specialized sub-services.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 2.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardFormService {
  selectedTask: Task | null = null;
  constructor(
    private taskService: TaskService,
    private formState: BoardFormStateService,
    private overlayService: BoardFormOverlayService,
    private contactService: BoardFormContactService
  ) {}
  get form() { return this.formState; }

  get overlay() { return this.overlayService; }

  get contacts() { return this.contactService; }

  get taskForm() { return this.formState.taskForm; }

  get showAddTaskOverlay() { return this.overlayService.showAddTaskOverlay; }

  get showTaskDetailsOverlay() { return this.overlayService.showTaskDetailsOverlay; }

  get isEditingTask() { return this.overlayService.isEditingTask; }

  get selectedPriority() { return this.formState.selectedPriority; }

  get currentColumn() { return this.overlayService.currentColumn; }

  get isDropdownOpen() { return this.contactService.isDropdownOpen; }

  get selectedContacts() { return this.contactService.selectedContacts; }

  get showAssignedContactsDropdown() { return this.contactService.showAssignedContactsDropdown; }

  get isCategoryDropdownOpen() { return this.contactService.isCategoryDropdownOpen; }

  get subtasksFormArray() { return this.formState.subtasksFormArray; }

  /**
   * Opens the add task overlay for a specific column.
   * 
   * @param column - The column where the new task should be created (defaults to 'todo')
   */
  openAddTaskOverlay(column: TaskColumn = 'todo'): void {
    this.overlayService.openAddTaskOverlay(column);
    this.formState.resetForm();
    this.contactService.resetContactSelection();
  }

  /**
   * Closes the add task overlay and resets all states.
   */
  closeAddTaskOverlay(): void {
    this.overlayService.closeAddTaskOverlay();
    this.contactService.resetContactSelection();
    this.formState.resetForm();
  }

  /**
   * Sets the selected priority and updates the form.
   * 
   * @param priority - The priority level to set
   */
  selectPriority(priority: 'urgent' | 'medium' | 'low'): void {
    this.formState.selectPriority(priority);
  }

  /**
   * Handles category change events and triggers validation.
   * 
   * @param event - Optional change event
   */
  onCategoryChange(event?: Event): void {
    this.formState.onCategoryChange(event);
  }

  /**
   * Resets the task form to its initial state.
   */
  resetForm(): void {
    this.formState.resetForm();
    this.contactService.resetContactSelection();
  }

  /**
   * Gets today's date as a formatted string for date inputs.
   * 
   * @returns Date string in YYYY-MM-DD format
   */
  getTodayDateString(): string {
    return this.formState.getTodayDateString();
  }

  /**
   * Checks if a date is in the past.
   * 
   * @param dateString - Date string to check
   * @returns True if date is in the past
   */
  isDateInPast(dateString: string): boolean {
    return this.formState.isDateInPast(dateString);
  }

  /**
   * Toggles the contact dropdown visibility.
   */
  toggleDropdown(): void {
    this.contactService.toggleDropdown();
  }

  /**
   * Toggles the category dropdown visibility.
   */
  toggleCategoryDropdown(): void {
    this.contactService.toggleCategoryDropdown();
  }

  /**
   * Toggles contact selection in the form.
   * 
   * @param contact - Contact to toggle
   * @param event - Click event
   */
  toggleContactSelection(contact: Contact, event: Event): void {
    this.contactService.toggleContactSelection(contact, event);
  }

  /**
   * Selects a contact from the dropdown.
   * 
   * @param contact - Contact to select
   */
  selectContact(contact: Contact): void {
    this.contactService.selectContact(contact);
  }

  /**
   * Adds a new subtask to the form.
   */
  addSubtask(): void {
    this.formState.addSubtask();
  }

  /**
   * Removes a subtask from the form.
   * 
   * @param index - Index of subtask to remove
   */
  removeSubtask(index: number): void {
    this.formState.removeSubtask(index);
  }

  /**
   * Opens the task details overlay for viewing/editing a task.
   * 
   * @param task - Task to view/edit
   */
  openTaskDetails(task: Task): void {
    this.selectedTask = task;
    this.overlayService.openTaskDetailsOverlay();
  }

  /**
   * Closes the task details overlay and resets editing state.
   */
  closeTaskDetailsOverlay(): void {
    this.overlayService.closeTaskDetailsOverlay();
    this.selectedTask = null;
    this.contactService.resetContactSelection();
  }

  /**
   * Starts editing mode for the current task.
   * 
   * @param contacts - Available contacts list
   */
  editTask(contacts: Contact[]): void {
    if (!this.selectedTask) return;
    this.overlayService.startEditingTask();
    this.formState.patchFormWithTaskData({
      title: this.selectedTask.title,
      description: this.selectedTask.description,
      dueDate: this.selectedTask.dueDate,
      priority: this.selectedTask.priority,
      category: this.selectedTask.category,
      subtasks: this.selectedTask.subtasks || []
    });
    if (this.selectedTask.assignedTo && this.selectedTask.assignedTo.length > 0) {
      const taskContacts = contacts.filter(contact => 
        this.selectedTask!.assignedTo!.includes(contact.name)
      );
      this.contactService.setSelectedContacts(taskContacts);
    }
  }

  /**
   * Cancels editing mode and resets form.
   */
  cancelEditTask(): void {
    this.overlayService.cancelEditingTask();
    this.formState.resetForm();
    this.contactService.resetContactSelection();
  }

  /**
   * Saves the current task (create new or update existing).
   * 
   * @returns Promise that resolves when task is saved
   */
  async saveTask(): Promise<void> {
    const validation = this.formState.validateForm();
    if (!validation.isValid) {
      throw new Error(`Form validation failed: ${validation.errors.join(', ')}`);
    }
    const formData = this.formState.getFormData();
    const contactNames = this.contactService.getSelectedContacts().map(c => c.name);
    const taskData: Partial<Task> = {
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      priority: formData.priority || 'medium',
      category: formData.category,
      assignedTo: contactNames,
      subtasks: formData.subtasks || [],
      column: this.overlayService.isEditingTask ? this.selectedTask?.column : this.overlayService.currentColumn
    };
    if (this.overlayService.isEditingTask && this.selectedTask) {
      await this.taskService.updateTask(this.selectedTask.id!, { ...this.selectedTask, ...taskData });
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskData
      } as Task;
      const taskDataForFirebase = { ...taskData } as Omit<Task, 'id'>;
      delete (taskDataForFirebase as any).id;
      await this.taskService.addTaskToFirebase(taskDataForFirebase, this.overlayService.currentColumn);
    }
  }

  /**
   * Toggles the assigned contacts dropdown.
   */
  toggleAssignedContactsDropdown(): void {
    this.contactService.toggleAssignedContactsDropdown();
  }

  /**
   * Gets display text for selected contacts.
   * 
   * @returns Formatted display text
   */
  getSelectedContactsDisplayText(): string {
    return this.contactService.getSelectedContactsDisplayText();
  }

  /**
   * Checks if a contact is currently selected.
   * 
   * @param contact - Contact to check
   * @returns True if contact is selected
   */
  isContactSelected(contact: Contact): boolean {
    return this.contactService.isContactSelected(contact);
  }

  /**
   * Cleanup method for when service is destroyed.
   */
  cleanup(): void {
    this.contactService.cleanup();
  }
}

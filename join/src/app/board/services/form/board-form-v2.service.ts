import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BoardFormValidationService } from './board-form-validation.service';
import { BoardFormOverlayService } from './board-form-overlay-v2.service';
import { BoardFormContactSelectionService } from './board-form-contact-selection.service';
import { BoardFormDataService } from './board-form-data.service';
import { Task } from '../../../interfaces/task.interface';
import { Contact } from '../../../contacts/services/contact-data.service';
/**
 * Main orchestrator service for board form functionality.
 * Coordinates all specialized board form services and provides unified interface.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })

export class BoardFormService {
  taskForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private validationService: BoardFormValidationService,
    private overlayService: BoardFormOverlayService,
    private contactSelectionService: BoardFormContactSelectionService,
    private dataService: BoardFormDataService
  ) {
    this.taskForm = this.createTaskForm();
  }

  /**
   * Creates and initializes the task form.
   * 
   * @returns Configured FormGroup
   */
  private createTaskForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      dueDate: [''],
      priority: ['medium', Validators.required],
      category: ['', Validators.required],
      subtasks: this.fb.array([])
    });
  }

  /**
   * Initializes form for creating a new task.
   * 
   * @param status - Initial task status
   */
  initializeNewTask(status: 'todo' | 'inprogress' | 'awaiting' | 'done' = 'todo'): void {
    const newTask = this.dataService.createNewTask(status);
    this.resetForm();
    this.overlayService.openAddTaskOverlay();
  }

  /**
   * Initializes form for editing an existing task.
   * 
   * @param task - Task to edit
   */
  initializeEditTask(task: Task): void {
    this.dataService.initializeForEdit(task);
    this.populateFormWithTask(task);
    this.contactSelectionService.setSelectedContactsByIds(task.assignedTo, []);
    this.overlayService.openTaskEditOverlay(task);
  }

  /**
   * Populates form with task data.
   * 
   * @param task - Task data to populate
   */
  private populateFormWithTask(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category
    });
  }

  /**
   * Saves the current task.
   * 
   * @returns Promise<boolean> - Success status
   */
  async saveTask(): Promise<boolean> {
    if (!this.validateForm()) {
      return false;
    }
    try {
      return await this.performTaskSave();
    } catch (error) {
      return this.handleSaveError(error);
    }
  }

  /**
   * Performs the actual task save operation.
   * 
   * @returns Promise<boolean> - Success status
   * @private
   */
  private async performTaskSave(): Promise<boolean> {
    const task = this.buildTaskFromForm();
    await this.saveTaskBasedOnMode(task);
    this.finalizeSaveOperation();
    return true;
  }

  /**
   * Saves task based on current mode (create or edit).
   * 
   * @param task - Task to save
   * @private
   */
  private async saveTaskBasedOnMode(task: Task): Promise<void> {
    if (this.dataService.getIsEditMode()) {
      await this.updateTask(task);
    } else {
      await this.createTask(task);
    }
  }

  /**
   * Finalizes the save operation by updating state and closing form.
   * 
   * @private
   */
  private finalizeSaveOperation(): void {
    this.dataService.saveChanges();
    this.closeForm();
  }

  /**
   * Handles save operation errors.
   * 
   * @param error - Error that occurred
   * @returns False to indicate failure
   * @private
   */
  private handleSaveError(error: any): boolean {
    console.error('Error saving task:', error);
    return false;
  }

  /**
   * Builds task object from form data.
   * 
   * @returns Task object
   */
  private buildTaskFromForm(): Task {
    const formValue = this.taskForm.value;
    const currentTask = this.dataService.getCurrentTask();
    if (!currentTask) {
      throw new Error('No current task available');
    }
    return {
      ...currentTask,
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
      assignedTo: this.contactSelectionService.getSelectedContactIds()
    };
  }

  /**
   * Creates a new task.
   * 
   * @param task - Task to create
   */
  private async createTask(task: Task): Promise<void> {
    console.log('Creating task:', task);
  }

  /**
   * Updates an existing task.
   * 
   * @param task - Task to update
   */
  private async updateTask(task: Task): Promise<void> {
    console.log('Updating task:', task);
  }

  /**
   * Validates the form using validation service.
   * 
   * @returns True if form is valid
   */
  validateForm(): boolean {
    const formValue = this.taskForm.value;
    const validation = this.validationService.validateForm(formValue);
    if (!validation.isValid) {
      console.warn('Form validation errors:', validation.errors);
      return false;
    }
    return true;
  }

  /**
   * Gets form validation errors.
   * 
   * @returns Array of validation error messages
   */
  getValidationErrors(): string[] {
    const formValue = this.taskForm.value;
    const validation = this.validationService.validateForm(formValue);
    return validation.errors;
  }

  /**
   * Resets the form to initial state.
   */
  resetForm(): void {
    this.taskForm.reset();
    this.taskForm.patchValue({
      priority: 'medium',
      category: ''
    });
    this.contactSelectionService.clearSelectedContacts();
  }

  /**
   * Closes the form and resets state.
   */
  closeForm(): void {
    this.resetForm();
    this.dataService.reset();
    this.overlayService.closeAllOverlays();
    this.contactSelectionService.cleanup();
  }

  /**
   * Cancels form editing and reverts changes.
   */
  cancelEdit(): void {
    if (this.dataService.hasChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.dataService.revertChanges();
        this.closeForm();
      }
    } else {
      this.closeForm();
    }
  }

  /**
   * Opens the task form overlay.
   * 
   * @param mode - Overlay mode
   */
  openOverlay(mode: 'create' | 'edit' = 'create'): void {
    if (mode === 'create') {
      this.overlayService.openAddTaskOverlay();
    } else {
      const currentTask = this.getCurrentTask();
      if (currentTask) {
        this.overlayService.openTaskEditOverlay(currentTask);
      }
    }
  }

  /**
   * Closes the task form overlay.
   */
  closeOverlay(): void {
    this.overlayService.closeAllOverlays();
  }

  /**
   * Checks if overlay is open.
   * 
   * @returns True if overlay is open
   */
  isOverlayOpen(): boolean {
    return this.overlayService.isAnyOverlayOpen();
  }

  /**
   * Gets current overlay mode.
   * 
   * @returns Current overlay mode
   */
  getOverlayMode(): 'create' | 'edit' | null {
    if (this.overlayService.showAddTaskOverlay) return 'create';
    if (this.overlayService.showTaskEditOverlay) return 'edit';
    return null;
  }

  /**
   * Toggles contact selection.
   * 
   * @param contact - Contact to toggle
   */
  toggleContact(contact: Contact): void {
    this.contactSelectionService.toggleContact(contact);
  }

  /**
   * Gets selected contacts.
   * 
   * @returns Array of selected contacts
   */
  getSelectedContacts(): Contact[] {
    return this.contactSelectionService.selectedContacts;
  }

  /**
   * Opens contact dropdown.
   */
  openContactDropdown(): void {
    this.contactSelectionService.openDropdown();
  }

  /**
   * Closes contact dropdown.
   */
  closeContactDropdown(): void {
    this.contactSelectionService.closeDropdown();
  }

  /**
   * Checks if contact dropdown is open.
   * 
   * @returns True if dropdown is open
   */
  isContactDropdownOpen(): boolean {
    return this.contactSelectionService.isDropdownOpen;
  }

  /**
   * Gets current task being edited.
   * 
   * @returns Current task or null
   */
  getCurrentTask(): Task | null {
    return this.dataService.getCurrentTask();
  }

  /**
   * Checks if form is in edit mode.
   * 
   * @returns True if editing existing task
   */
  isEditMode(): boolean {
    return this.dataService.getIsEditMode();
  }

  /**
   * Adds a subtask to current task.
   * 
   * @param title - Subtask title
   */
  addSubtask(title: string): void {
    this.dataService.addSubtask(title);
  }

  /**
   * Removes a subtask from current task.
   * 
   * @param subtaskId - ID of subtask to remove
   */
  removeSubtask(subtaskId: string): void {
    this.dataService.removeSubtask(subtaskId);
  }

  /**
   * Gets all subtasks for current task.
   * 
   * @returns Array of subtasks
   */
  getSubtasks() {
    return this.dataService.getSubtasks();
  }

  /**
   * Gets basic form validation status.
   * 
   * @returns True if Angular form is valid
   */
  isFormValid(): boolean {
    return this.taskForm.valid;
  }

  /**
   * Gets Angular form validation errors.
   * 
   * @returns Object with field errors
   */
  getFormErrors(): any {
    return this.taskForm.errors;
  }

  /**
   * Cleanup method for destroying the service.
   */
  cleanup(): void {
    this.dataService.cleanup();
    this.contactSelectionService.cleanup();
    this.overlayService.cleanup();
  }
}

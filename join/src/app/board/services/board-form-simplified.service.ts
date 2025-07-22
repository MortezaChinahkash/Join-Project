import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BoardFormValidationService } from './board-form-validation.service';
import { BoardFormOverlayService } from './board-form-overlay-v2.service';
import { BoardFormContactSelectionService } from './board-form-contact-selection.service';
import { BoardFormDataService } from './board-form-data.service';
import { BoardFormTaskOperationsService } from './board-form-task-operations.service';
import { BoardFormStateService } from './board-form-state.service';
import { Task } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';

/**
 * Simplified main orchestrator service for board form functionality.
 * Provides core functionality while delegating specialized tasks to sub-services.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 2.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardFormService {
  private _isCategoryDropdownOpen: boolean = false;
  
  /** Constructor initializes all services */
  constructor(
    public validationService: BoardFormValidationService,
    public overlayService: BoardFormOverlayService,
    public contactSelectionService: BoardFormContactSelectionService,
    public dataService: BoardFormDataService,
    public taskOperations: BoardFormTaskOperationsService,
    public formState: BoardFormStateService
  ) {}

  // ===========================
  // Core Form Operations  
  // ===========================

  /** Gets the task form from form state service */
  get taskForm(): FormGroup {
    return this.formState.getTaskForm();
  }

  /**
   * Initializes form for creating a new task.
   * 
   * @param status - Initial task status
   */
  initializeNewTask(status: 'todo' | 'inprogress' | 'awaiting' | 'done' = 'todo'): void {
    this.dataService.createNewTask(status);
    this.resetForm();
    this.overlayService.openAddTaskOverlay(status);
  }

  /**
   * Initializes form for editing an existing task.
   * 
   * @param task - Task to edit
   * @param allContacts - Array of all available contacts
   */
  initializeEditTask(task: Task, allContacts: Contact[] = []): void {
    this.dataService.initializeForEdit(task);
    this.formState.populateFormWithTask(task);
    this.contactSelectionService.setSelectedContactsByNames(task.assignedTo || [], allContacts);
    this.overlayService.openTaskEditOverlay(task);
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
      const task = this.buildTaskFromForm();
      if (this.dataService.getIsEditMode()) {
        await this.taskOperations.updateTask(task);
      } else {
        await this.taskOperations.createTask(task);
      }
      this.dataService.saveChanges();
      this.closeForm();
      return true;
    } catch (error) {
      console.error('❌ Error saving task:', error);
      return false;
    }
  }

  /**
   * Validates the form using validation service.
   * 
   * @returns True if form is valid
   */
  validateForm(): boolean {
    this.taskForm.markAllAsTouched();
    const validation = this.validationService.validateForm(this.taskForm);
    
    if (!validation.isValid) {
      console.warn('❌ Form validation errors:', validation.errors);
      return false;
    }
    return true;
  }

  /**
   * Resets the form to initial state.
   */
  resetForm(): void {
    this.formState.resetForm();
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

  // ===========================
  // Task Building
  // ===========================

  /**
   * Builds task object from form data.
   * 
   * @returns Task object
   */
  private buildTaskFromForm(): Task {
    const formValue = this.taskForm.value;
    const currentTask = this.getOrCreateCurrentTask();
    const selectedContactNames = this.contactSelectionService.selectedContacts.map(contact => contact.name);
    
    return this.taskOperations.mergeTaskWithFormData(currentTask, formValue, selectedContactNames);
  }

  /**
   * Gets existing task or creates a new one if none exists.
   * 
   * @returns Current or newly created task
   */
  private getOrCreateCurrentTask(): Task {
    let currentTask = this.dataService.getCurrentTask();
    
    if (!currentTask) {
      currentTask = this.createNewTaskTemplate();
    }
    
    return currentTask;
  }

  /**
   * Creates a new task template with default values.
   * 
   * @returns New task template
   */
  private createNewTaskTemplate(): Task {
    const targetColumn = this.overlayService.getCurrentColumn();
    
    return {
      id: this.taskOperations.generateTaskId(),
      title: '',
      description: '',
      assignedTo: [],
      dueDate: '',
      priority: 'medium',
      column: targetColumn,
      subtasks: [],
      category: '',
      createdAt: new Date()
    };
  }

  // ===========================
  // Category Management
  // ===========================

  /** Gets category dropdown open state */
  get isCategoryDropdownOpen(): boolean {
    return this._isCategoryDropdownOpen;
  }

  /**
   * Toggles category dropdown state.
   */
  toggleCategoryDropdown(): void {
    this._isCategoryDropdownOpen = !this._isCategoryDropdownOpen;
  }

  /**
   * Closes category dropdown.
   */
  closeCategoryDropdown(): void {
    this._isCategoryDropdownOpen = false;
  }

  /**
   * Selects a category.
   * 
   * @param category - Category parameter
   */
  selectCategory(category: string): void {
    this.formState.selectCategory(category);
    this._isCategoryDropdownOpen = false;
  }

  /**
   * Gets category display text.
   * 
   * @param categoryValue - Category value or form parameter
   * @returns String result
   */
  getCategoryDisplayText(categoryValue: any): string {
    const category = (typeof categoryValue === 'string') ? categoryValue : categoryValue?.get?.('category')?.value;
    return category === 'technical' ? 'Technical Task' : 
           category === 'user-story' ? 'User Story' : 'Select Category';
  }

  // ===========================
  // Priority Management
  // ===========================

  /** Gets currently selected priority */
  get selectedPriority(): string {
    return this.formState.getSelectedPriority();
  }

  /**
   * Selects a priority.
   * 
   * @param priority - Priority parameter
   */
  selectPriority(priority: string): void {
    this.formState.selectPriority(priority);
  }

  // ===========================
  // Subtask Management
  // ===========================

  /** Gets subtasks form array */
  get subtasksFormArray(): any {
    return this.formState.getSubtasksFormArray();
  }

  /**
   * Creates subtask group.
   * 
   * @param title - Title parameter
   * @param completed - Completed parameter
   * @returns FormGroup
   */
  createSubtaskGroup(title: string = '', completed: boolean = false) {
    return this.formState.createSubtaskGroup(title, completed);
  }

  /**
   * Adds a new subtask to the form.
   * 
   * @param title - Title of the new subtask
   */
  addNewSubtask(title: string): void {
    this.formState.addNewSubtask(title);
  }

  /**
   * Removes a subtask from the form by index.
   * 
   * @param index - Index of the subtask to remove
   */
  removeSubtaskByIndex(index: number): void {
    this.formState.removeSubtaskByIndex(index);
  }

  // ===========================
  // Validation Helpers
  // ===========================

  /**
   * Checks if field is invalid.
   * 
   * @param fieldName - Field name parameter
   * @returns Boolean result
   */
  isFieldInvalid(fieldName: string): boolean {
    return this.validationService.isFieldInvalid(this.taskForm, fieldName);
  }

  /**
   * Checks if date is invalid.
   * 
   * @param fieldName - Field name parameter
   * @param form - Optional form parameter
   * @returns Boolean result
   */
  isDateInvalid(fieldName: string, form?: any): boolean {
    return this.validationService.isDateInvalid(form || this.taskForm, fieldName);
  }

  /**
   * Gets field error message.
   * 
   * @param fieldName - Field name parameter
   * @returns String result
   */
  getFieldErrorMessage(fieldName: string): string {
    return this.validationService.getFieldErrorMessage(this.taskForm, fieldName);
  }

  /**
   * Gets form validation errors.
   * 
   * @returns Array of validation error messages
   */
  getValidationErrors(): string[] {
    const validation = this.validationService.validateForm(this.taskForm);
    return validation.errors;
  }

  /**
   * Gets basic form validation status.
   * 
   * @returns True if Angular form is valid
   */
  isFormValid(): boolean {
    return this.formState.isFormValid();
  }

  /**
   * Gets Angular form validation errors.
   * 
   * @returns Object with field errors
   */
  getFormErrors(): any {
    return this.formState.getFormErrors();
  }

  // ===========================
  // Cleanup
  // ===========================

  /**
   * Cleanup method for destroying the service.
   */
  cleanup(): void {
    this.dataService.cleanup();
    this.contactSelectionService.cleanup();
    this.overlayService.cleanup();
  }
}

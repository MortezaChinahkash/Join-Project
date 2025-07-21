import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
/**
 * Service for managing task form state and validation.
 * Handles form creation, validation, and state management.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardFormStateService {
  taskForm: FormGroup;
  selectedPriority: 'urgent' | 'medium' | 'low' | '' = '';
  constructor(private fb: FormBuilder) {
    this.taskForm = this.createTaskForm();
  }

  /**
   * Creates and initializes the reactive task form with validation rules.
   * 
   * @returns FormGroup with all necessary form controls and validators
   */
  createTaskForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      priority: [''], // Priority is optional, set via buttons
      assignedTo: [''],
      category: ['', Validators.required],
      subtasks: this.fb.array([])
    });
  }

  /**
   * Gets the subtasks form array from the main form.
   * 
   * @returns FormArray for subtasks
   */
  get subtasksFormArray(): FormArray {
    return this.taskForm.get('subtasks') as FormArray;
  }

  /**
   * Sets the selected priority and updates the form.
   * 
   * @param priority - The priority level to set
   */
  selectPriority(priority: 'urgent' | 'medium' | 'low'): void {
    this.selectedPriority = priority;
    this.taskForm.patchValue({ priority: priority });

    // Mark priority field as touched to trigger validation
    this.taskForm.get('priority')?.markAsTouched();
  }

  /**
   * Handles category change events and triggers validation.
   * 
   * @param event - Optional change event
   */
  onCategoryChange(event?: Event): void {
    // Mark category field as touched when changed
    this.taskForm.get('category')?.markAsTouched();
    // Force update validation status
    this.taskForm.get('category')?.updateValueAndValidity();
  }

  /**
   * Resets the task form to its initial state with default values.
   */
  resetForm(): void {
    this.taskForm.reset();
    this.selectedPriority = '';
    // Clear all subtasks
    while (this.subtasksFormArray.length !== 0) {
      this.subtasksFormArray.removeAt(0);
    }
    // Set today's date as default for due date and medium priority as default
    const today = this.getTodayDateString();
    this.taskForm.patchValue({
      dueDate: today,
      priority: 'medium'
    });
    // Set medium as default selected priority
    this.selectedPriority = 'medium';
  }

  /**
   * Gets today's date as a formatted string for date inputs.
   * 
   * @returns Date string in YYYY-MM-DD format
   */
  getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Checks if a date is in the past.
   * 
   * @param dateString - Date string to check
   * @returns True if date is in the past
   */
  isDateInPast(dateString: string): boolean {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates
    return selectedDate < today; // True if date is in the past
  }

  /**
   * Adds a new subtask to the form array.
   */
  addSubtask(): void {
    const subtaskGroup = this.fb.group({
      title: ['', Validators.required],
      completed: [false]
    });
    this.subtasksFormArray.push(subtaskGroup);
  }

  /**
   * Removes a subtask from the form array.
   * 
   * @param index - Index of subtask to remove
   */
  removeSubtask(index: number): void {
    if (index >= 0 && index < this.subtasksFormArray.length) {
      this.subtasksFormArray.removeAt(index);
    }
  }

  /**
   * Creates a subtask form group.
   * 
   * @param title - Subtask title
   * @param completed - Whether subtask is completed
   * @returns FormGroup for subtask
   */
  createSubtaskGroup(title: string = '', completed: boolean = false): FormGroup {
    return this.fb.group({
      title: [title, Validators.required],
      completed: [completed]
    });
  }

  /**
   * Validates the entire form and returns validation result.
   * 
   * @returns Object with validation status and errors
   */
  validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!this.taskForm.valid) {
      if (this.taskForm.get('title')?.hasError('required')) {
        errors.push('Title is required');
      }
      if (this.taskForm.get('dueDate')?.hasError('required')) {
        errors.push('Due date is required');
      }
      if (this.taskForm.get('category')?.hasError('required')) {
        errors.push('Category is required');
      }
    }
    return {
      isValid: this.taskForm.valid,
      errors
    };
  }

  /**
   * Gets form data as a plain object.
   * 
   * @returns Form data object
   */
  getFormData(): any {
    return this.taskForm.value;
  }

  /**
   * Patches the form with task data for editing.
   * 
   * @param taskData - Task data to populate form with
   */
  patchFormWithTaskData(taskData: any): void {
    this.taskForm.patchValue(taskData);
    // Handle subtasks if they exist
    if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
      // Clear existing subtasks
      while (this.subtasksFormArray.length !== 0) {
        this.subtasksFormArray.removeAt(0);
      }
      // Add subtasks from task data
      taskData.subtasks.forEach((subtask: any) => {
        const subtaskGroup = this.createSubtaskGroup(subtask.title, subtask.completed);
        this.subtasksFormArray.push(subtaskGroup);
      });
    }
    // Set priority
    if (taskData.priority) {
      this.selectedPriority = taskData.priority;
    }
  }
}

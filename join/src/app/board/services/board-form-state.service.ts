import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Task } from '../../interfaces/task.interface';
import { BoardFormTaskOperationsService } from './board-form-task-operations.service';

/**
 * Service for managing form state and form operations.
 * Handles form creation, population, reset, and subtask management.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardFormStateService {
  private taskForm: FormGroup;
  
  /**
   * Constructor initializes form state service
   */
  constructor(
    private fb: FormBuilder,
    private taskOperations: BoardFormTaskOperationsService
  ) {
    this.taskForm = this.createTaskForm();
  }

  /**
   * Gets the current task form.
   * 
   * @returns Current FormGroup
   */
  getTaskForm(): FormGroup {
    return this.taskForm;
  }

  /**
   * Creates and initializes the task form.
   * 
   * @returns Configured FormGroup
   */
  createTaskForm(): FormGroup {
    const today = new Date();
    const todayFormatted = this.taskOperations.formatDateToAmerican(today);
    
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dueDate: [todayFormatted, Validators.required],
      priority: ['medium', Validators.required],
      category: ['', Validators.required],
      subtasks: this.fb.array([])
    });
  }

  /**
   * Populates form with task data.
   * 
   * @param task - Task data to populate
   */
  populateFormWithTask(task: Task): void {
    const formattedDate = this.taskOperations.processTaskDate(task.dueDate);
    this.patchFormWithTaskData(task, formattedDate);
    this.populateSubtasks(task.subtasks || []);
  }

  /**
   * Patches the form with task data and formatted date.
   * 
   * @param task - Task data
   * @param formattedDate - Formatted due date
   */
  private patchFormWithTaskData(task: Task, formattedDate: string): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: formattedDate,
      priority: task.priority,
      category: task.category
    });
  }

  /**
   * Populates the subtasks FormArray with task subtasks.
   * 
   * @param subtasks - Array of subtasks to populate
   */
  populateSubtasks(subtasks: any[]): void {
    const subtasksFormArray = this.getSubtasksFormArray();
    
    while (subtasksFormArray.length !== 0) {
      subtasksFormArray.removeAt(0);
    }
    
    subtasks.forEach(subtask => {
      const subtaskGroup = this.fb.group({
        title: [subtask.title || ''],
        completed: [subtask.completed || false],
        id: [subtask.id || Date.now().toString()]
      });
      subtasksFormArray.push(subtaskGroup);
    });
  }

  /**
   * Resets the form to initial state.
   */
  resetForm(): void {
    this.taskForm.reset();
    const today = new Date();
    const todayFormatted = this.taskOperations.formatDateToAmerican(today);
    this.taskForm.patchValue({
      priority: 'medium',
      category: '',
      dueDate: todayFormatted
    });
    
    this.clearSubtasks();
  }

  /**
   * Clears all subtasks from the FormArray.
   */
  clearSubtasks(): void {
    const subtasksFormArray = this.getSubtasksFormArray();
    while (subtasksFormArray.length !== 0) {
      subtasksFormArray.removeAt(0);
    }
  }

  /**
   * Gets the subtasks FormArray.
   * 
   * @returns Subtasks FormArray
   */
  getSubtasksFormArray(): FormArray {
    return this.taskForm.get('subtasks') as FormArray;
  }

  /**
   * Creates a subtask form group.
   * 
   * @param title - Subtask title
   * @param completed - Completion status
   * @returns FormGroup for subtask
   */
  createSubtaskGroup(title: string = '', completed: boolean = false): FormGroup {
    return this.fb.group({
      title: [title],
      completed: [completed],
      id: [Date.now().toString()]
    });
  }

  /**
   * Adds a new subtask to the form.
   * 
   * @param title - Title of the new subtask
   */
  addNewSubtask(title: string): void {
    if (title.trim()) {
      const subtaskGroup = this.createSubtaskGroup(title.trim());
      this.getSubtasksFormArray().push(subtaskGroup);
    }
  }

  /**
   * Removes a subtask from the form by index.
   * 
   * @param index - Index of the subtask to remove
   */
  removeSubtaskByIndex(index: number): void {
    this.getSubtasksFormArray().removeAt(index);
  }

  /**
   * Gets currently selected priority.
   * 
   * @returns Current priority value
   */
  getSelectedPriority(): string {
    return this.taskForm.get('priority')?.value || 'medium';
  }

  /**
   * Selects a priority.
   * 
   * @param priority - Priority to select
   */
  selectPriority(priority: string): void {
    this.taskForm.patchValue({ priority });
  }

  /**
   * Selects a category.
   * 
   * @param category - Category to select
   */
  selectCategory(category: string): void {
    this.taskForm.patchValue({ category });
    this.taskForm.get('category')?.markAsTouched();
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
}

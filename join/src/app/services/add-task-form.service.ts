import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Contact } from './contact-data.service';

/**
 * Service for managing add task form operations.
 * Handles form creation, validation, and contact management.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AddTaskFormService {

  constructor(private formBuilder: FormBuilder) {}

  /**
   * Creates the reactive form for task creation.
   * @returns Configured FormGroup
   */
  createTaskForm(): FormGroup {
    return this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dueDate: ['', Validators.required],
      priority: ['', Validators.required],
      category: ['', Validators.required],
      assignedTo: [[]],
      subtasks: this.formBuilder.array([])
    });
  }

  /**
   * Creates a form group for a subtask.
   * @param title - Initial title (default: empty)
   * @param completed - Initial completion status (default: false)
   * @returns FormGroup for subtask
   */
  createSubtaskGroup(title: string = '', completed: boolean = false): FormGroup {
    return this.formBuilder.group({
      title: [title],
      completed: [completed]
    });
  }

  /**
   * Sets default form values.
   * @param form - Form to set defaults for
   */
  setDefaultValues(form: FormGroup): void {
    form.patchValue({ priority: 'medium' });
  }

  /**
   * Updates form with selected priority.
   * @param form - Form to update
   * @param priority - Priority to set
   */
  updateFormPriority(form: FormGroup, priority: string): void {
    form.patchValue({ priority });
  }

  /**
   * Updates form with assigned contacts.
   * @param form - Form to update
   * @param contacts - Selected contacts
   */
  updateFormAssignedContacts(form: FormGroup, contacts: Contact[]): void {
    const contactNames = contacts.map(c => c.name);
    form.patchValue({ assignedTo: contactNames });
  }

  /**
   * Gets the subtasks FormArray from the form.
   * @param form - Form containing subtasks
   * @returns FormArray containing subtasks
   */
  getSubtasksFormArray(form: FormGroup): FormArray {
    return form.get('subtasks') as FormArray;
  }

  /**
   * Adds a new subtask to the form.
   * @param form - Form to add subtask to
   */
  addSubtask(form: FormGroup): void {
    const subtaskGroup = this.createSubtaskGroup();
    const subtasksArray = this.getSubtasksFormArray(form);
    subtasksArray.push(subtaskGroup);
  }

  /**
   * Removes a subtask from the form.
   * @param form - Form to remove subtask from
   * @param index - Index of subtask to remove
   */
  removeSubtask(form: FormGroup, index: number): void {
    const subtasksArray = this.getSubtasksFormArray(form);
    subtasksArray.removeAt(index);
  }

  /**
   * Clears all subtasks from the form.
   * @param form - Form to clear subtasks from
   */
  clearAllSubtasks(form: FormGroup): void {
    const subtasksArray = this.getSubtasksFormArray(form);
    while (subtasksArray.length !== 0) {
      subtasksArray.removeAt(0);
    }
  }

  /**
   * Filters out empty subtasks.
   * @param subtasks - Array of subtasks from form
   * @returns Array of valid subtasks
   */
  filterValidSubtasks(subtasks: any[]): any[] {
    return subtasks.filter(subtask => 
      subtask && subtask.title && subtask.title.trim() !== ''
    );
  }

  /**
   * Marks all form fields as touched for validation display.
   * @param form - Form to mark as touched
   */
  markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      this.markControlAsTouched(form, key);
    });
  }

  /**
   * Marks a specific form control as touched.
   * @param form - Form containing the control
   * @param controlKey - Key of the form control
   */
  private markControlAsTouched(form: FormGroup, controlKey: string): void {
    const control = form.get(controlKey);
    control?.markAsTouched();
    
    if (control instanceof FormArray) {
      this.markFormArrayControlsTouched(control);
    }
  }

  /**
   * Marks FormArray controls as touched.
   * @param formArray - FormArray to mark as touched
   */
  private markFormArrayControlsTouched(formArray: FormArray): void {
    formArray.controls.forEach(arrayControl => {
      arrayControl.markAsTouched();
    });
  }

  /**
   * Gets validation error message for a field.
   * @param form - Form containing the field
   * @param fieldName - Name of the field
   * @returns Error message string
   */
  getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    
    if (!this.hasControlErrors(control)) {
      return '';
    }
    
    return this.formatErrorMessage(fieldName, control!.errors!);
  }

  /**
   * Checks if control has errors and is touched.
   * @param control - Form control to check
   * @returns True if control has errors
   */
  private hasControlErrors(control: any): boolean {
    return control?.errors && control.touched;
  }

  /**
   * Formats error message based on error type.
   * @param fieldName - Field name for message
   * @param errors - Error object
   * @returns Formatted error message
   */
  private formatErrorMessage(fieldName: string, errors: any): string {
    if (errors['required']) {
      return `${fieldName} is required`;
    }
    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `${fieldName} must be at least ${requiredLength} characters`;
    }
    return '';
  }

  /**
   * Validates if form can be submitted.
   * @param form - Form to validate
   * @param isSubmitting - Current submitting state
   * @returns True if form can be submitted
   */
  canSubmitForm(form: FormGroup, isSubmitting: boolean): boolean {
    if (!form.valid) {
      this.markFormGroupTouched(form);
      return false;
    }
    return !isSubmitting;
  }
}

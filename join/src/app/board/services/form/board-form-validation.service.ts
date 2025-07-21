import { Injectable } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';
/**
 * Service for handling form validation logic.
 * Manages validation rules, error checking, and validation feedback.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })

export class BoardFormValidationService {
  /**
   * Checks if a specific form field is invalid and has been touched.
   * 
   * @param form - The form group to validate
   * @param fieldName - Name of the field to check
   * @returns True if field is invalid and touched
   */
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Checks if a date field is invalid (past date or empty).
   * 
   * @param form - The form group to validate
   * @param fieldName - Name of the date field to check
   * @returns True if date is invalid
   */
  isDateInvalid(form: FormGroup, fieldName: string = 'dueDate'): boolean {
    const field = form.get(fieldName);
    if (!field || !field.value) return false;
    const selectedDate = new Date(field.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }

  /**
   * Gets validation error message for a specific field.
   * 
   * @param form - The form group
   * @param fieldName - Name of the field
   * @returns Error message string
   */
  getFieldErrorMessage(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.errors) return '';
    return this.buildErrorMessage(field.errors, fieldName);
  }

  /**
   * Builds appropriate error message based on error type.
   * 
   * @param errors - Field errors object
   * @param fieldName - Name of the field
   * @returns Error message string
   * @private
   */
  private buildErrorMessage(errors: any, fieldName: string): string {
    if (errors['required']) {
      return this.getRequiredErrorMessage(fieldName);
    }
    if (errors['minlength']) {
      return this.getMinLengthErrorMessage(fieldName, errors['minlength'].requiredLength);
    }
    if (errors['maxlength']) {
      return this.getMaxLengthErrorMessage(fieldName, errors['maxlength'].requiredLength);
    }
    if (errors['email']) {
      return this.getEmailErrorMessage();
    }
    return 'This field is invalid';
  }

  /**
   * Gets required field error message.
   * 
   * @param fieldName - Name of the field
   * @returns Required error message
   * @private
   */
  private getRequiredErrorMessage(fieldName: string): string {
    return `${this.getFieldDisplayName(fieldName)} is required`;
  }

  /**
   * Gets minimum length error message.
   * 
   * @param fieldName - Name of the field
   * @param requiredLength - Required minimum length
   * @returns Min length error message
   * @private
   */
  private getMinLengthErrorMessage(fieldName: string, requiredLength: number): string {
    return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters`;
  }

  /**
   * Gets maximum length error message.
   * 
   * @param fieldName - Name of the field
   * @param requiredLength - Required maximum length
   * @returns Max length error message
   * @private
   */
  private getMaxLengthErrorMessage(fieldName: string, requiredLength: number): string {
    return `${this.getFieldDisplayName(fieldName)} cannot exceed ${requiredLength} characters`;
  }

  /**
   * Gets email validation error message.
   * 
   * @returns Email error message
   * @private
   */
  private getEmailErrorMessage(): string {
    return 'Please enter a valid email address';
  }

  /**
   * Gets display name for a field.
   * 
   * @param fieldName - Internal field name
   * @returns User-friendly display name
   */
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'title': 'Title',
      'description': 'Description',
      'dueDate': 'Due Date',
      'priority': 'Priority',
      'category': 'Category',
      'assignedTo': 'Assigned Contacts'
    };
    return displayNames[fieldName] || fieldName;
  }

  /**
   * Validates the entire form and returns validation summary.
   * 
   * @param form - The form group to validate
   * @returns Validation summary object
   */
  validateForm(form: FormGroup): {
    isValid: boolean;
    errors: string[];
    fieldErrors: { [key: string]: string };
  } {
    const errors: string[] = [];
    const fieldErrors: { [key: string]: string } = {};
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          const errorMessage = this.getFieldErrorMessage(form, key);
          errors.push(errorMessage);
          fieldErrors[key] = errorMessage;
        }
      }
    });

    if (this.isDateInvalid(form)) {
      const dateError = 'Due date cannot be in the past';
      errors.push(dateError);
      fieldErrors['dueDate'] = dateError;
    }
    return {
      isValid: form.valid && !this.isDateInvalid(form),
      errors,
      fieldErrors
    };
  }

  /**
   * Validates required fields for task creation.
   * 
   * @param form - The form group
   * @returns True if all required fields are valid
   */
  validateRequiredFields(form: FormGroup): boolean {
    const requiredFields = ['title', 'description', 'dueDate'];
    return requiredFields.every(field => {
      const control = form.get(field);
      return control && control.valid && control.value?.trim();
    });
  }

  /**
   * Checks if a form control has a specific error.
   * 
   * @param control - Form control to check
   * @param errorType - Type of error to check for
   * @returns True if control has the specified error
   */
  hasError(control: AbstractControl, errorType: string): boolean {
    return !!(control && control.errors && control.errors[errorType] && control.touched);
  }

  /**
   * Gets today's date string in YYYY-MM-DD format for date inputs.
   * 
   * @returns Today's date string
   */
  getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Validates subtask title.
   * 
   * @param title - Subtask title to validate
   * @returns True if valid
   */
  validateSubtaskTitle(title: string): boolean {
    return !!(title && title.trim().length >= 2 && title.trim().length <= 50);
  }

  /**
   * Sanitizes and validates form input.
   * 
   * @param value - Input value to sanitize
   * @param maxLength - Maximum allowed length
   * @returns Sanitized value
   */
  sanitizeInput(value: string, maxLength: number = 255): string {
    if (!value) return '';
    return value.trim().substring(0, maxLength);
  }

  /**
   * Resets validation state for all form fields.
   * 
   * @param form - Form to reset validation
   */
  resetValidation(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control) {
        control.markAsUntouched();
        control.markAsPristine();
      }
    });
  }
}

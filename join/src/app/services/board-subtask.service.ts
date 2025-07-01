import { Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

/**
 * Service for managing subtask operations in the board component.
 * Handles subtask editing, creation, and form interactions.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardSubtaskService {

  /**
   * Focuses on a specific subtask input field for editing.
   * 
   * @param index - Index of the subtask to edit
   */
  focusSubtaskInput(index: number): void {
    setTimeout(() => {
      const inputElement = this.findSubtaskInputElement(index);
      if (inputElement) {
        this.activateInputElement(inputElement);
      }
    }, 0);
  }

  /**
   * Finds the input element for a specific subtask.
   * 
   * @param index - Index of the subtask
   * @returns Input element or null if not found
   */
  private findSubtaskInputElement(index: number): HTMLInputElement | null {
    const selector = `.taskEditOverlay [formGroupName="${index}"] input[formControlName="title"]`;
    return document.querySelector(selector) as HTMLInputElement;
  }

  /**
   * Activates an input element by focusing and selecting text.
   * 
   * @param inputElement - Input element to activate
   */
  private activateInputElement(inputElement: HTMLInputElement): void {
    inputElement.focus();
    inputElement.select();
  }

  /**
   * Adds a new subtask to the form array.
   * 
   * @param title - Title of the new subtask
   * @param subtasksFormArray - Form array to add to
   * @param createSubtaskGroup - Function to create subtask form group
   */
  addSubtaskToForm(
    title: string, 
    subtasksFormArray: FormArray, 
    createSubtaskGroup: (title: string, completed: boolean) => FormGroup
  ): void {
    const trimmedTitle = this.validateSubtaskTitle(title);
    if (trimmedTitle) {
      const newSubtaskGroup = createSubtaskGroup(trimmedTitle, false);
      subtasksFormArray.push(newSubtaskGroup);
    }
  }

  /**
   * Validates and trims subtask title.
   * 
   * @param title - Raw title string
   * @returns Trimmed title or null if invalid
   */
  private validateSubtaskTitle(title: string): string | null {
    const trimmed = title.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /**
   * Removes a subtask from the form array.
   * 
   * @param index - Index of subtask to remove
   * @param subtasksFormArray - Form array to remove from
   */
  removeSubtaskFromForm(index: number, subtasksFormArray: FormArray): void {
    if (this.isValidSubtaskIndex(index, subtasksFormArray)) {
      subtasksFormArray.removeAt(index);
    }
  }

  /**
   * Validates if the subtask index is within bounds.
   * 
   * @param index - Index to validate
   * @param subtasksFormArray - Form array to check against
   * @returns True if index is valid
   */
  private isValidSubtaskIndex(index: number, subtasksFormArray: FormArray): boolean {
    return index >= 0 && index < subtasksFormArray.length;
  }

  /**
   * Updates a subtask's completion status.
   * 
   * @param index - Index of subtask to update
   * @param completed - New completion status
   * @param subtasksFormArray - Form array containing the subtask
   */
  updateSubtaskCompletion(
    index: number, 
    completed: boolean, 
    subtasksFormArray: FormArray
  ): void {
    if (this.isValidSubtaskIndex(index, subtasksFormArray)) {
      const subtaskGroup = subtasksFormArray.at(index) as FormGroup;
      subtaskGroup.patchValue({ completed });
    }
  }

  /**
   * Gets the current completion status of a subtask.
   * 
   * @param index - Index of subtask
   * @param subtasksFormArray - Form array containing the subtask
   * @returns Current completion status
   */
  getSubtaskCompletion(index: number, subtasksFormArray: FormArray): boolean {
    if (this.isValidSubtaskIndex(index, subtasksFormArray)) {
      const subtaskGroup = subtasksFormArray.at(index) as FormGroup;
      return subtaskGroup.get('completed')?.value || false;
    }
    return false;
  }

  /**
   * Counts completed subtasks in the form array.
   * 
   * @param subtasksFormArray - Form array to count from
   * @returns Number of completed subtasks
   */
  countCompletedSubtasks(subtasksFormArray: FormArray): number {
    return subtasksFormArray.controls.reduce((count, control) => {
      const formGroup = control as FormGroup;
      const isCompleted = formGroup.get('completed')?.value || false;
      return count + (isCompleted ? 1 : 0);
    }, 0);
  }

  /**
   * Calculates completion percentage of subtasks.
   * 
   * @param subtasksFormArray - Form array to calculate from
   * @returns Completion percentage (0-100)
   */
  calculateSubtaskProgress(subtasksFormArray: FormArray): number {
    const totalSubtasks = subtasksFormArray.length;
    if (totalSubtasks === 0) return 0;
    
    const completedSubtasks = this.countCompletedSubtasks(subtasksFormArray);
    return Math.round((completedSubtasks / totalSubtasks) * 100);
  }
}

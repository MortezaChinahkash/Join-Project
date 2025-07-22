import { Injectable } from '@angular/core';
import { Task, Subtask } from '../../interfaces/task.interface';

/**
 * Service for handling board form utility operations.
 * Manages task utilities, ID generation, and data manipulation functions.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardFormUtilityService {

  /**
   * Validates task data.
   *
   * @param task - Task to validate
   * @returns Validation result with errors
   */
  validateTaskData(task: Task | null): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!this.validateTaskExists(task, errors)) {
      return { isValid: false, errors };
    }
    this.validateRequiredFields(task!, errors);
    this.validateDueDate(task!, errors);
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates that a task exists.
   *
   * @param task - Task to check
   * @param errors - Array to collect validation errors
   * @returns True if task exists, false otherwise
   * @private
   */
  private validateTaskExists(task: Task | null, errors: string[]): boolean {
    if (!task) {
      errors.push('No task data available');
      return false;
    }
    return true;
  }

  /**
   * Validates required task fields.
   *
   * @param task - Task to validate
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateRequiredFields(task: Task, errors: string[]): void {
    this.validateTitle(task, errors);
    this.validateDescription(task, errors);
    this.validateCategory(task, errors);
  }

  /**
   * Validates task title field.
   *
   * @param task - Task to validate
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateTitle(task: Task, errors: string[]): void {
    if (!task.title?.trim()) {
      errors.push('Title is required');
    }
  }

  /**
   * Validates task description field.
   *
   * @param task - Task to validate
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateDescription(task: Task, errors: string[]): void {
    if (!task.description?.trim()) {
      errors.push('Description is required');
    }
  }

  /**
   * Validates task category field.
   *
   * @param task - Task to validate
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateCategory(task: Task, errors: string[]): void {
    if (!task.category?.trim()) {
      errors.push('Category is required');
    }
  }

  /**
   * Validates task due date field.
   *
   * @param task - Task to validate
   * @param errors - Array to collect validation errors
   * @private
   */
  private validateDueDate(task: Task, errors: string[]): void {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = this.getTodayDate();
      if (dueDate < today) {
        errors.push('Due date cannot be in the past');
      }
    }
  }

  /**
   * Gets today's date with time set to midnight.
   *
   * @returns Today's date at 00:00:00
   * @private
   */
  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Generates a unique task ID.
   *
   * @returns Unique task ID
   */
  generateTaskId(): string {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generates a unique subtask ID.
   *
   * @returns Unique subtask ID
   */
  generateSubtaskId(): string {
    return 'subtask_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Creates a deep clone of a task object.
   *
   * @param task - Task to clone
   * @returns Cloned task
   */
  deepCloneTask(task: Task): Task {
    return JSON.parse(JSON.stringify(task));
  }

  /**
   * Checks if two tasks are equal by comparing their JSON representation.
   *
   * @param task1 - First task to compare
   * @param task2 - Second task to compare
   * @returns True if tasks are equal
   */
  areTasksEqual(task1: Task | null, task2: Task | null): boolean {
    if (!task1 || !task2) return false;
    return JSON.stringify(task1) === JSON.stringify(task2);
  }

  /**
   * Builds a new task object with default values.
   *
   * @param status - Initial task status
   * @returns New task object with defaults
   */
  buildTaskWithDefaults(
    status: 'todo' | 'inprogress' | 'awaiting' | 'done'
  ): Task {
    return {
      id: this.generateTaskId(),
      title: '',
      description: '',
      assignedTo: [],
      dueDate: '',
      priority: 'medium',
      column: status,
      subtasks: [],
      category: '',
      createdAt: new Date(),
    };
  }
}

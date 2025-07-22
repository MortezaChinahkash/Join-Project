import { Injectable } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';

/**
 * Service for handling task CRUD operations in board forms.
 * Manages task creation, updates, and data processing.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardFormTaskOperationsService {

  /**
   * Constructor initializes task operations service
   */
  constructor(private taskService: TaskService) {}

  /**
   * Creates a new task in the system.
   * 
   * @param task - Task to create
   */
  async createTask(task: Task): Promise<void> {
    try {
      const { id, ...taskWithoutId } = task;
      await this.taskService.addTaskToFirebase(taskWithoutId, task.column);
    } catch (error) {
      console.error('❌ Error creating task:', error);
      throw error;
    }
  }

  /**
   * Updates an existing task in the system.
   * 
   * @param task - Task to update
   */
  async updateTask(task: Task): Promise<void> {
    try {
      await this.taskService.updateTaskInFirebase(task);
    } catch (error) {
      console.error('❌ Error updating task:', error);
      throw error;
    }
  }

  /**
   * Generates a temporary ID for new tasks.
   * 
   * @returns Generated string ID
   */
  generateTaskId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Formats a date to American format (MM/dd/yyyy).
   * 
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDateToAmerican(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Processes and formats the task due date.
   * 
   * @param dueDate - Original due date string
   * @returns Formatted date string
   */
  processTaskDate(dueDate: string): string {
    if (!dueDate) return dueDate;
    
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) return dueDate;
    
    return this.formatDateToAmerican(date);
  }

  /**
   * Merges task data with form values and contact names.
   * 
   * @param currentTask - Current task data
   * @param formValue - Form values
   * @param contactNames - Selected contact names
   * @returns Merged task object
   */
  mergeTaskWithFormData(currentTask: Task, formValue: any, contactNames: string[]): Task {
    return {
      ...currentTask,
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
      assignedTo: contactNames,
      subtasks: formValue.subtasks || []
    };
  }
}

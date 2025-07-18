import { Injectable } from '@angular/core';
import { Task } from '../../interfaces/task.interface';

/**
 * Service for handling task display utilities and helper functions.
 * Provides methods for task progress calculation, contact display, and search functionality.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardUtilsService {

  /**
   * Calculates the completion percentage of subtasks for a given task.
   * 
   * @param task - The task to calculate progress for
   * @returns Progress percentage (0-100)
   */
  getTaskProgress(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(subtask => subtask.completed).length;
    return (completed / task.subtasks.length) * 100;
  }

  /**
   * Gets the number of completed subtasks for a task.
   * 
   * @param task - The task to count completed subtasks for
   * @returns Number of completed subtasks
   */
  getCompletedSubtasks(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter(subtask => subtask.completed).length;
  }

  /**
   * Gets the appropriate priority icon path for a task.
   * 
   * @param priority - The priority level of the task
   * @returns Path to the priority icon
   */
  getPriorityIcon(priority: Task['priority']): string {
    switch (priority) {
      case 'urgent':
        return './assets/img/icon_priority_urgent.svg';
      case 'medium':
        return './assets/img/icon_priority_medium.svg';
      case 'low':
        return './assets/img/icon_priority_low.svg';
      default:
        // Fallback: Always show medium priority icon if no priority is set
        return './assets/img/icon_priority_medium.svg';
    }
  }

  /**
   * Sorts tasks by priority (urgent > medium > low).
   * 
   * @param tasks - Array of tasks to sort
   * @returns Sorted array of tasks
   */
  sortTasksByPriority(tasks: Task[]): Task[] {
    const priorityOrder = { 'urgent': 3, 'medium': 2, 'low': 1 };
    
    const sortedTasks = tasks.sort((a, b) => {
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      // Höhere Priorität (höhere Zahl) kommt zuerst
      return priorityB - priorityA;
    });

    return sortedTasks;
  }

  /**
   * Filters tasks based on search term in title and description.
   * 
   * @param tasks - Array of tasks to filter
   * @param searchTerm - The search term to filter by
   * @returns Filtered array of tasks
   */
  getFilteredTasks(tasks: Task[], searchTerm: string): Task[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return tasks;
    }
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchTermLower) ||
      (task.description && task.description.toLowerCase().includes(searchTermLower))
    );
  }

  /**
   * Checks if search returned no results across all task arrays.
   * 
   * @param searchTerm - The current search term
   * @param todoTasks - Array of todo tasks
   * @param inProgressTasks - Array of in progress tasks
   * @param awaitingFeedbackTasks - Array of awaiting feedback tasks
   * @param doneTasks - Array of done tasks
   * @returns True if no search results found
   */
  hasNoSearchResults(
    searchTerm: string,
    todoTasks: Task[],
    inProgressTasks: Task[],
    awaitingFeedbackTasks: Task[],
    doneTasks: Task[]
  ): boolean {
    return !!searchTerm
      && this.getFilteredTasks(todoTasks, searchTerm).length === 0
      && this.getFilteredTasks(inProgressTasks, searchTerm).length === 0
      && this.getFilteredTasks(awaitingFeedbackTasks, searchTerm).length === 0
      && this.getFilteredTasks(doneTasks, searchTerm).length === 0;
  }

  // Contact display utility methods

  /**
   * Gets the first 4 contacts for display (avatar limit).
   * 
   * @param assignedTo - Array of assigned contact names
   * @returns Array of first 4 contact names
   */
  getDisplayedContacts(assignedTo: string[]): string[] {
    if (!assignedTo || assignedTo.length === 0) return [];
    return assignedTo.slice(0, 4);
  }

  /**
   * Gets the count of contacts beyond the display limit.
   * 
   * @param assignedTo - Array of assigned contact names
   * @returns Number of remaining contacts not displayed
   */
  getRemainingContactsCount(assignedTo: string[]): number {
    if (!assignedTo || assignedTo.length <= 4) return 0;
    return assignedTo.length - 4;
  }

  /**
   * Checks if there are contacts beyond the display limit.
   * 
   * @param assignedTo - Array of assigned contact names
   * @returns True if more than 4 contacts
   */
  hasRemainingContacts(assignedTo: string[]): boolean {
    return assignedTo && assignedTo.length > 4;
  }

  /**
   * Checks if task has multiple assigned contacts.
   * 
   * @param assignedTo - Array of assigned contact names
   * @returns True if more than 1 contact
   */
  hasMultipleContacts(assignedTo: string[]): boolean {
    return assignedTo && assignedTo.length > 1;
  }

  /**
   * Gets the total count of assigned contacts.
   * 
   * @param assignedTo - Array of assigned contact names
   * @returns Total number of assigned contacts
   */
  getContactCount(assignedTo: string[]): number {
    return assignedTo ? assignedTo.length : 0;
  }

  // Subtask progress methods for task details

  /**
   * Gets the subtask completion progress for the selected task.
   * 
   * @param selectedTask - The task to calculate subtask progress for
   * @returns Progress percentage (0-100)
   */
  getSubtaskProgress(selectedTask: Task | null): number {
    if (!selectedTask?.subtasks || selectedTask.subtasks.length === 0) {
      return 0;
    }
    const completed = selectedTask.subtasks.filter(subtask => subtask.completed).length;
    return (completed / selectedTask.subtasks.length) * 100;
  }

  /**
   * Gets the count of completed subtasks for the selected task.
   * 
   * @param selectedTask - The task to count completed subtasks for
   * @returns Number of completed subtasks
   */
  getCompletedSubtasksCount(selectedTask: Task | null): number {
    if (!selectedTask?.subtasks) return 0;
    return selectedTask.subtasks.filter(subtask => subtask.completed).length;
  }
}





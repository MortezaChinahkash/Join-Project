import { Injectable } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { BoardUtilsService } from './board-utils.service';
/**
 * Service responsible for display-related functionality in the board component.
 * Handles text formatting, search operations, and UI utility functions.
 */
/**
 * Service for handling display-related functionality and text formatting.
 * Manages task filtering, text truncation, progress calculation, and visual display utilities.
 * 
 * This service provides methods for:
 * - Text truncation with safety checks for null/undefined values
 * - Task filtering based on search criteria
 * - Progress calculation for task completion status
 * - Priority icon path resolution
 * - Search result validation and empty state detection
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 * @since 2024
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDisplayService {
  constructor(private utilsService: BoardUtilsService) {}

  /**
   * Safely truncates text to a maximum length.
   * @param text - Text to truncate
   * @param limit - Maximum length
   * @returns Truncated text with ellipsis if needed
   */
  truncateText(text: string | null | undefined, limit: number = 200): string {
    const content = text ?? '';
    if (content.length <= limit) {
      return content;
    }
    return content.slice(0, limit) + 'â€¦';
  }

  /**
   * Gets filtered tasks based on search term.
   * @param tasks - Tasks to filter
   * @param searchTerm - Search term to filter by
   * @returns Filtered tasks array
   */
  getFilteredTasks(tasks: Task[], searchTerm: string): Task[] {
    return this.utilsService.getFilteredTasks(tasks, searchTerm);
  }

  /**
   * Checks if there are no search results across all columns.
   * @param searchTerm - Current search term
   * @param todoTasks - Tasks in todo column
   * @param inProgressTasks - Tasks in progress column
   * @param awaitingFeedbackTasks - Tasks awaiting feedback
   * @param doneTasks - Completed tasks
   * @returns True if no tasks match search criteria
   */
  hasNoSearchResults(
    searchTerm: string,
    todoTasks: Task[],
    inProgressTasks: Task[],
    awaitingFeedbackTasks: Task[],
    doneTasks: Task[]
  ): boolean {
    return this.utilsService.hasNoSearchResults(
      searchTerm,
      todoTasks,
      inProgressTasks,
      awaitingFeedbackTasks,
      doneTasks
    );
  }

  /**
   * Gets task completion progress as percentage.
   * @param task - Task to calculate progress for
   * @returns Progress percentage (0-100)
   */
  getTaskProgress(task: Task): number {
    return this.utilsService.getTaskProgress(task);
  }

  /**
   * Gets number of completed subtasks.
   * @param task - Task to count subtasks for
   * @returns Number of completed subtasks
   */
  getCompletedSubtasks(task: Task): number {
    return this.utilsService.getCompletedSubtasks(task);
  }

  /**
   * Gets priority icon path for a task.
   * @param priority - Task priority level
   * @returns Icon path string
   */
  getPriorityIcon(priority: Task['priority']): string {
    return this.utilsService.getPriorityIcon(priority);
  }
}

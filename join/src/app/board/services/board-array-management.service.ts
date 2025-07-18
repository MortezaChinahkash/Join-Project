import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { BoardTaskManagementService } from './board-task-management.service';

/**
 * Service responsible for managing task arrays and column operations.
 * Handles array updates, task distribution, and column state management.
 * 
 * This service provides methods for:
 * - Updating task arrays after task changes
 * - Distributing tasks across different columns
 * - Handling task movement between columns
 * - Managing column state and task assignments
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 * @since 2024
 */
@Injectable({
  providedIn: 'root'
})
export class BoardArrayManagementService {

  constructor(private taskManagementService: BoardTaskManagementService) {}

  /**
   * Updates task arrays after task changes.
   * @param tasks - Current tasks array
   * @param selectedTask - Currently selected task
   * @param updateTaskCallback - Callback to update the main tasks array
   * @param distributeCallback - Callback to redistribute tasks to columns
   */
  updateTaskArrays(
    tasks: Task[],
    selectedTask: Task | null,
    updateTaskCallback: (updatedTasks: Task[]) => void,
    distributeCallback: () => void
  ): void {
    if (!selectedTask) {
      distributeCallback();
      return;
    }

    const taskIndex = this.taskManagementService.findTaskIndex(tasks);
    if (taskIndex !== -1) {
      const updatedTasks = this.taskManagementService.updateTaskInArray(tasks, taskIndex);
      updateTaskCallback(updatedTasks);
    }
    distributeCallback();
  }

  /**
   * Assigns distributed tasks to component arrays.
   * @param distributed - Object with distributed tasks for each column
   * @returns Updated column arrays
   */
  assignTasksToColumns(distributed: {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  }): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    return {
      todoTasks: distributed.todoTasks,
      inProgressTasks: distributed.inProgressTasks,
      awaitingFeedbackTasks: distributed.awaitingFeedbackTasks,
      doneTasks: distributed.doneTasks
    };
  }

  /**
   * Handles task movement between columns.
   * @param task - Task being moved
   * @param fromColumn - Source column
   * @param toColumn - Target column
   * @param currentColumns - Current column arrays
   * @returns Updated column arrays after move
   */
  handleTaskMovement(
    task: Task,
    fromColumn: TaskColumn | null,
    toColumn: TaskColumn,
    currentColumns: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    }
  ): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    // Remove from current column if exists
    let updatedColumns = currentColumns;
    if (fromColumn) {
      updatedColumns = this.taskManagementService.removeTaskFromColumn(task, fromColumn, updatedColumns);
    }
    
    // Add to target column
    updatedColumns = this.taskManagementService.addTaskToColumn(task, toColumn, updatedColumns);
    
    return updatedColumns;
  }

  /**
   * Removes a task from the main tasks array and redistributes.
   * @param tasks - Current tasks array
   * @param taskToRemove - Task to remove
   * @param distributeCallback - Callback to redistribute tasks to columns
   * @returns Updated tasks array
   */
  removeTaskAndRedistribute(
    tasks: Task[],
    taskToRemove: Task,
    distributeCallback: () => void
  ): Task[] {
    const updatedTasks = tasks.filter(t => t.id !== taskToRemove.id);
    distributeCallback();
    return updatedTasks;
  }

  /**
   * Gets the current column arrays as an object.
   * @param todoTasks - Todo column tasks
   * @param inProgressTasks - In progress column tasks
   * @param awaitingFeedbackTasks - Awaiting feedback column tasks
   * @param doneTasks - Done column tasks
   * @returns Object with all column arrays
   */
  getCurrentColumnArrays(
    todoTasks: Task[],
    inProgressTasks: Task[],
    awaitingFeedbackTasks: Task[],
    doneTasks: Task[]
  ): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    return {
      todoTasks,
      inProgressTasks,
      awaitingFeedbackTasks,
      doneTasks
    };
  }

  /**
   * Updates component arrays with new column data.
   * @param updatedColumns - New column arrays
   * @param updateCallback - Callback to update component arrays
   */
  updateComponentArrays(
    updatedColumns: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    updateCallback: (columns: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    }) => void
  ): void {
    updateCallback(updatedColumns);
  }
}





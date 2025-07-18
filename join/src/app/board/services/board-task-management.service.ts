import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardFormService } from './board-form.service';
import { BoardUtilsService } from './board-utils.service';
import { BoardDataService } from './board-data.service';
import { DeleteConfirmationService } from '../../shared/services/delete-confirmation.service';
import { TaskEditOverlayService } from './task-edit-overlay.service';
import { Contact } from '../../contacts/services/contact-data.service';

/**
 * Service responsible for managing all task-related operations in the board component.
 * Handles task creation, editing, deletion, and array management.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardTaskManagementService {

  constructor(
    private taskService: TaskService,
    private formService: BoardFormService,
    private utilsService: BoardUtilsService,
    private dataService: BoardDataService,
    private deleteConfirmationService: DeleteConfirmationService,
    private taskEditOverlayService: TaskEditOverlayService
  ) {}

  /**
   * Finds the index of the currently selected task in the tasks array.
   * @param tasks - Array of all tasks
   * @returns Index of task or -1 if not found
   */
  findTaskIndex(tasks: Task[]): number {
    return tasks.findIndex(
      (t) => t.id === this.formService.selectedTask?.id
    );
  }

  /**
   * Updates a task in the tasks array at the specified index.
   * @param tasks - Array of all tasks
   * @param taskIndex - Index of task to update
   * @returns Updated tasks array
   */
  updateTaskInArray(tasks: Task[], taskIndex: number): Task[] {
    if (this.formService.selectedTask && taskIndex !== -1) {
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = this.formService.selectedTask;
      return updatedTasks;
    }
    return tasks;
  }

  /**
   * Removes the selected task from the tasks array.
   * @param tasks - Array of all tasks
   * @returns Updated tasks array without the selected task
   */
  removeSelectedTaskFromArray(tasks: Task[]): Task[] {
    return tasks.filter(
      (t) => t.id !== this.formService.selectedTask!.id
    );
  }

  /**
   * Removes the task to delete from the tasks array.
   * @param tasks - Array of all tasks
   * @returns Updated tasks array without the task to delete
   */
  removeTaskToDeleteFromArray(tasks: Task[]): Task[] {
    return tasks.filter(
      (t) => t.id !== this.deleteConfirmationService.taskToDelete!.id
    );
  }

  /**
   * Distributes tasks into appropriate columns and sorts by priority.
   * @param tasks - Array of all tasks
   * @returns Object with distributed tasks for each column
   */
  distributeAndSortTasks(tasks: Task[]): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    const distributed = this.dataService.distributeTasksToColumns(tasks);
    return {
      todoTasks: this.utilsService.sortTasksByPriority(distributed.todoTasks),
      inProgressTasks: this.utilsService.sortTasksByPriority(distributed.inProgressTasks),
      awaitingFeedbackTasks: this.utilsService.sortTasksByPriority(distributed.awaitingFeedbackTasks),
      doneTasks: this.utilsService.sortTasksByPriority(distributed.doneTasks)
    };
  }

  /**
   * Opens the add task overlay for the specified column.
   * @param column - Target column for the new task
   */
  openAddTaskOverlay(column: TaskColumn = 'todo'): void {
    this.formService.openAddTaskOverlay(column);
  }

  /**
   * Closes the add task overlay.
   */
  closeAddTaskOverlay(): void {
    this.formService.closeAddTaskOverlay();
  }

  /**
   * Opens task details overlay for the specified task.
   * @param task - Task to display details for
   */
  openTaskDetails(task: Task): void {
    this.formService.openTaskDetails(task);
  }

  /**
   * Closes the task details overlay.
   */
  closeTaskDetailsOverlay(): void {
    this.formService.closeTaskDetailsOverlay();
  }

  /**
   * Enters edit mode for the selected task.
   * @param contacts - Array of all contacts for assignment
   */
  editTask(contacts: Contact[]): void {
    if (!this.formService.selectedTask) return;
    this.taskEditOverlayService.openEditOverlay(this.formService.selectedTask, contacts);
  }

  /**
   * Cancels task editing and reverts changes.
   */
  cancelEditTask(): void {
    this.taskEditOverlayService.closeEditOverlay();
  }

  /**
   * Saves task changes and updates arrays.
   * @param updateCallback - Callback to update task arrays
   */
  async saveTaskChanges(updateCallback: () => void): Promise<void> {
    await this.taskEditOverlayService.saveTaskChanges(updateCallback);
  }

  /**
   * Deletes the selected task and shows confirmation dialog.
   */
  async deleteTask(): Promise<void> {
    if (!this.formService.selectedTask) return;
    this.deleteConfirmationService.deleteTask(this.formService.selectedTask);
  }

  /**
   * Confirms task deletion and updates arrays.
   * @param updateCallback - Callback to update task arrays after deletion
   */
  async confirmDeleteTask(updateCallback: () => void): Promise<void> {
    await this.deleteConfirmationService.confirmDeleteTask(updateCallback);
  }

  /**
   * Closes the delete confirmation dialog.
   */
  closeDeleteConfirmation(): void {
    this.deleteConfirmationService.closeDeleteConfirmation();
  }

  /**
   * Submits the task form and calls update callback.
   * @param updateCallback - Callback to update task arrays
   */
  async submitTaskForm(updateCallback: () => void): Promise<void> {
    await this.formService.onSubmit(updateCallback);
  }

  /**
   * Toggles subtask completion status.
   * @param subtaskIndex - Index of the subtask to toggle
   * @param updateCallback - Callback to update task arrays
   */
  async toggleSubtask(subtaskIndex: number, updateCallback: () => void): Promise<void> {
    await this.formService.toggleSubtask(subtaskIndex, updateCallback);
  }

  /**
   * Removes task from its current column array.
   * @param task - Task to remove
   * @param fromColumn - Column to remove from
   * @param columnArrays - Object containing all column arrays
   * @returns Updated column arrays
   */
  removeTaskFromColumn(
    task: Task, 
    fromColumn: TaskColumn,
    columnArrays: {
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
    const updated = { ...columnArrays };
    
    switch (fromColumn) {
      case 'todo':
        updated.todoTasks = updated.todoTasks.filter(t => t.id !== task.id);
        break;
      case 'inprogress':
        updated.inProgressTasks = updated.inProgressTasks.filter(t => t.id !== task.id);
        break;
      case 'awaiting':
        updated.awaitingFeedbackTasks = updated.awaitingFeedbackTasks.filter(t => t.id !== task.id);
        break;
      case 'done':
        updated.doneTasks = updated.doneTasks.filter(t => t.id !== task.id);
        break;
    }
    
    return updated;
  }

  /**
   * Adds task to specified column array.
   * @param task - Task to add
   * @param column - Target column
   * @param columnArrays - Object containing all column arrays
   * @returns Updated column arrays
   */
  addTaskToColumn(
    task: Task, 
    column: TaskColumn,
    columnArrays: {
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
    const updated = { ...columnArrays };
    
    switch (column) {
      case 'todo':
        updated.todoTasks = [...updated.todoTasks, task];
        break;
      case 'inprogress':
        updated.inProgressTasks = [...updated.inProgressTasks, task];
        break;
      case 'awaiting':
        updated.awaitingFeedbackTasks = [...updated.awaitingFeedbackTasks, task];
        break;
      case 'done':
        updated.doneTasks = [...updated.doneTasks, task];
        break;
    }
    
    return updated;
  }
}





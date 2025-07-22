import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';

/**
 * Service for managing board component utility methods.
 * Centralizes utility methods to reduce component complexity.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardComponentUtilsService {

  /** Template for board column configurations */
  private readonly columnTemplate = [
    {
      id: 'todo' as TaskColumn,
      title: 'To Do',
      taskProperty: 'todoTasks',
      showAddButton: true,
      emptyMessage: 'No tasks to do',
    },
    {
      id: 'inprogress' as TaskColumn,
      title: 'In Progress',
      taskProperty: 'inProgressTasks',
      showAddButton: true,
      emptyMessage: 'No tasks in progress',
    },
    {
      id: 'awaiting' as TaskColumn,
      title: 'Awaiting feedback',
      taskProperty: 'awaitingFeedbackTasks',
      showAddButton: true,
      emptyMessage: 'No tasks awaiting feedback',
    },
    {
      id: 'done' as TaskColumn,
      title: 'Done',
      taskProperty: 'doneTasks',
      showAddButton: false,
      emptyMessage: 'No tasks done',
    },
  ];

  /**
   * Initializes task arrays for component.
   * @returns Empty task column structure
   */
  initializeLocalArrays(): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    return {
      todoTasks: [],
      inProgressTasks: [],
      awaitingFeedbackTasks: [],
      doneTasks: []
    };
  }

  /**
   * Assigns tasks to component columns.
   * @param distributed - Distributed task structure
   * @param component - Component reference for assignment
   */
  assignTasksToComponentColumns(
    distributed: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    component: any
  ): void {
    component.todoTasks = distributed.todoTasks;
    component.inProgressTasks = distributed.inProgressTasks;
    component.awaitingFeedbackTasks = distributed.awaitingFeedbackTasks;
    component.doneTasks = distributed.doneTasks;
  }

  /**
   * Creates column configurations for the board.
   * @param component - Component reference for task arrays
   * @returns Column configuration array
   */
  createColumnConfiguration(component: any): any[] {
    return this.columnTemplate.map(template => ({
      id: template.id,
      title: template.title,
      tasks: () => component[template.taskProperty],
      showAddButton: template.showAddButton,
      emptyMessage: template.emptyMessage,
    }));
  }

  /**
   * Handles query parameters functionality.
   * @param taskColumns - Current task columns
   * @param openTaskCallback - Callback to open task
   * @param lifecycleService - Lifecycle service for handling params
   */
  handleComponentQueryParams(
    taskColumns: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    openTaskCallback: (task: Task) => void,
    lifecycleService: any
  ): void {
    lifecycleService.handleQueryParams(taskColumns, openTaskCallback);
  }
}

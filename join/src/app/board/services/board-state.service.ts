import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';
import { BoardInitializationService } from './board-initialization.service';
import { BoardArrayManagementService } from './board-array-management.service';
import { BoardLifecycleService } from './board-lifecycle.service';

/**
 * Service for managing board state and lifecycle operations.
 * Centralizes state management logic for the board component.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardStateService {
  
  /**
   * Initializes the board state service with required dependencies.
   * 
   * @param initializationService - Service for board initialization
   * @param arrayManagementService - Service for managing task arrays
   * @param lifecycleService - Service for component lifecycle management
   */
  constructor(
    private initializationService: BoardInitializationService,
    private arrayManagementService: BoardArrayManagementService,
    private lifecycleService: BoardLifecycleService
  ) {}

  /**
   * Initializes component with contacts and tasks.
   * @param contactsCallback - Callback to set contacts
   * @param tasksCallback - Callback to set tasks
   * @param completeCallback - Callback when initialization complete
   */
  initializeComponent(
    contactsCallback: (contacts: Contact[]) => void,
    tasksCallback: (tasks: Task[]) => void,
    completeCallback: () => void
  ): void {
    this.initializationService.initializeComponent(
      contactsCallback,
      tasksCallback,
      completeCallback
    );
  }

  /**
   * Distributes and sorts tasks into columns.
   * @param tasks - Array of tasks to distribute
   * @returns Distributed task columns
   */
  distributeAndSortTasks(tasks: Task[]): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    return this.initializationService.distributeAndSortTasks(tasks);
  }

  /**
   * Assigns tasks to column arrays.
   * @param distributed - Distributed task arrays
   * @returns Assigned task columns
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
    return this.arrayManagementService.assignTasksToColumns(distributed);
  }

  /**
   * Initializes task arrays from service.
   * @returns Initialized task columns
   */
  initializeTaskArrays(): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    return this.initializationService.initializeTaskArrays();
  }

  /**
   * Updates task arrays after changes.
   * @param tasks - Current tasks array
   * @param selectedTask - Currently selected task
   * @param tasksUpdateCallback - Callback to update tasks
   * @param distributeCallback - Callback to redistribute tasks
   */
  updateTaskArrays(
    tasks: Task[],
    selectedTask: Task | null,
    tasksUpdateCallback: (tasks: Task[]) => void,
    distributeCallback: () => void
  ): void {
    this.arrayManagementService.updateTaskArrays(
      tasks,
      selectedTask,
      tasksUpdateCallback,
      distributeCallback
    );
  }

  /**
   * Handles query parameters for task opening or filtering.
   * @param taskColumns - Current task column arrays
   * @param openTaskCallback - Callback to open specific task
   */
  handleQueryParams(
    taskColumns: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    openTaskCallback: (task: Task) => void
  ): void {
    this.lifecycleService.handleQueryParams(taskColumns, openTaskCallback);
  }
}

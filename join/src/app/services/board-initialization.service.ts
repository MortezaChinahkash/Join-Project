import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Contact } from './contact-data.service';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { BoardDataService } from './board-data.service';
import { BoardThumbnailService } from './board-thumbnail.service';
import { TaskService } from './task.service';
import { BoardUtilsService } from './board-utils.service';
import { BoardTaskManagementService } from './board-task-management.service';

/**
 * Service responsible for component initialization and lifecycle management.
 * Handles data loading, fragment navigation, scroll setup, and array initialization.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardInitializationService {

  constructor(
    private dataService: BoardDataService,
    private thumbnailService: BoardThumbnailService,
    private taskService: TaskService,
    private utilsService: BoardUtilsService,
    private taskManagementService: BoardTaskManagementService,
    private route: ActivatedRoute
  ) {}

  /**
   * Initializes the component with all necessary data and setup.
   * @param onContactsLoaded - Callback when contacts are loaded
   * @param onTasksLoaded - Callback when tasks are loaded
   * @param onQueryParamsHandled - Callback to handle query parameters
   */
  initializeComponent(
    onContactsLoaded: (contacts: Contact[]) => void,
    onTasksLoaded: (tasks: Task[]) => void,
    onQueryParamsHandled: () => void
  ): void {
    this.loadContactsData(onContactsLoaded);
    this.loadTasksData(onTasksLoaded);
    this.setupScrollListener();
    this.handleFragmentNavigation();
    onQueryParamsHandled();
  }

  /**
   * Loads contacts from Firebase and sorts them alphabetically.
   * @param onContactsLoaded - Callback when contacts are loaded
   */
  private loadContactsData(onContactsLoaded: (contacts: Contact[]) => void): void {
    this.dataService.loadContactsFromFirebase().subscribe({
      next: (contacts: Contact[]) => {
        const sortedContacts = this.dataService.sortContactsAlphabetically(contacts);
        onContactsLoaded(sortedContacts);
      },
      error: (error: any) => {
        console.error('Error loading contacts:', error);
      }
    });
  }

  /**
   * Loads tasks from Firebase and subscribes to real-time updates.
   * @param onTasksLoaded - Callback when tasks are loaded
   */
  private loadTasksData(onTasksLoaded: (tasks: Task[]) => void): void {
    this.dataService.loadTasksFromFirebase().subscribe({
      next: (tasks: Task[]) => {
        onTasksLoaded(tasks);
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  /**
   * Sets up the scroll listener for thumbnail navigation.
   */
  private setupScrollListener(): void {
    setTimeout(() => {
      this.thumbnailService.setupScrollListener();
    }, 500);
  }

  /**
   * Handles fragment navigation to scroll to specific columns.
   */
  private handleFragmentNavigation(): void {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          const targetElement = document.getElementById(fragment);
          if (targetElement) {
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 500); // Wait for data to load
      }
    });
  }

  /**
   * Initializes and updates local task arrays with the latest data from the task service.
   * @returns Object with initialized task arrays for each column
   */
  initializeTaskArrays(): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    return {
      todoTasks: this.utilsService.sortTasksByPriority(
        this.taskService.getTasksByColumn('todo')
      ),
      inProgressTasks: this.utilsService.sortTasksByPriority(
        this.taskService.getTasksByColumn('inprogress')
      ),
      awaitingFeedbackTasks: this.utilsService.sortTasksByPriority(
        this.taskService.getTasksByColumn('awaiting')
      ),
      doneTasks: this.utilsService.sortTasksByPriority(
        this.taskService.getTasksByColumn('done')
      )
    };
  }

  /**
   * Distributes tasks into appropriate columns and sorts by priority.
   * @param tasks - Array of all tasks to distribute
   * @returns Object with distributed and sorted tasks for each column
   */
  distributeAndSortTasks(tasks: Task[]): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    return this.taskManagementService.distributeAndSortTasks(tasks);
  }

  /**
   * Handles query parameters to open specific tasks or apply filters.
   * @param columnArrays - Object containing all column arrays
   * @param onTaskSelected - Callback when task is selected
   */
  handleQueryParameters(
    columnArrays: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    onTaskSelected: (task: Task) => void
  ): void {
    this.route.queryParams.subscribe(params => {
      if (params['taskId']) {
        const allTasks = [
          ...columnArrays.todoTasks,
          ...columnArrays.inProgressTasks,
          ...columnArrays.awaitingFeedbackTasks,
          ...columnArrays.doneTasks
        ];
        
        const targetTask = allTasks.find(task => task.id === params['taskId']);
        if (targetTask) {
          setTimeout(() => onTaskSelected(targetTask), 500);
        }
      }
    });
  }
}

import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Task } from '../interfaces/task.interface';

/**
 * Service for handling navigation and query parameter operations.
 * Manages URL-based task navigation and fragment scrolling.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardNavigationService {

  constructor(private route: ActivatedRoute) {}

  /**
   * Handles query parameters to open specific tasks or apply filters.
   * @param taskArrays - Object containing all task arrays
   * @param openTaskCallback - Callback function to open task details
   */
  handleQueryParams(
    taskArrays: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    openTaskCallback: (task: Task) => void
  ): void {
    this.route.queryParams.subscribe(params => {
      if (params['selectedTask']) {
        // Wait for tasks to load before trying to open the selected task
        setTimeout(() => {
          this.openTaskById(params['selectedTask'], taskArrays, openTaskCallback);
        }, 1000); // Wait for data to load
      }
    });
  }

  /**
   * Opens task details for a specific task by its ID.
   * @param taskId - ID of the task to open
   * @param taskArrays - Object containing all task arrays
   * @param openTaskCallback - Callback function to open task details
   */
  private openTaskById(
    taskId: string,
    taskArrays: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    openTaskCallback: (task: Task) => void
  ): void {
    // Find the task in all columns
    const allTasks = [
      ...taskArrays.todoTasks,
      ...taskArrays.inProgressTasks,
      ...taskArrays.awaitingFeedbackTasks,
      ...taskArrays.doneTasks
    ];
    
    const targetTask = allTasks.find(task => task.id === taskId);
    
    if (targetTask) {
      // Open the task details overlay
      openTaskCallback(targetTask);
    }
  }

  /**
   * Handles fragment navigation to scroll to specific columns.
   */
  handleFragmentNavigation(): void {
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
}

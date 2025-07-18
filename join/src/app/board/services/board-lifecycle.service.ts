import { Injectable } from '@angular/core';
import { Contact } from '../../contacts/services/contact-data.service';
import { Task } from '../../interfaces/task.interface';
import { BoardDataService } from './board-data.service';
import { BoardNavigationService } from './board-navigation.service';
import { BoardInteractionService } from './board-interaction.service';
/**
 * Service responsible for managing component lifecycle operations.
 * Handles initialization, data loading, and navigation setup.
 */
/**
 * Service for managing board lifecycle events and component state.
 * Handles initialization, cleanup, and component lifecycle coordination.
 * 
 * This service provides methods for:
 * - Component initialization sequence management
 * - Lifecycle state tracking and coordination
 * - Resource cleanup and memory management
 * - Component state synchronization
 * - Event listener registration and cleanup
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 * @since 2024
 */
@Injectable({
  providedIn: 'root'
})
export class BoardLifecycleService {
  constructor(
    private dataService: BoardDataService,
    private navigationService: BoardNavigationService,
    private interactionService: BoardInteractionService
  ) {}
  /**
   * Loads contacts from Firebase and sorts them alphabetically.
   * @param onContactsLoaded - Callback when contacts are loaded
   * @param onError - Callback when error occurs
   */
  loadContacts(
    onContactsLoaded: (contacts: Contact[]) => void,
    onError: (error: any) => void
  ): void {
    this.dataService.loadContactsFromFirebase().subscribe({
      next: (contacts) => {
        const sortedContacts = this.dataService.sortContactsAlphabetically(contacts);
        onContactsLoaded(sortedContacts);
      },
      error: onError
    });
  }
  /**
   * Loads tasks from Firebase and subscribes to real-time updates.
   * @param onTasksLoaded - Callback when tasks are loaded
   * @param onError - Callback when error occurs
   */
  loadTasks(
    onTasksLoaded: (tasks: Task[]) => void,
    onError: (error: any) => void
  ): void {
    this.dataService.loadTasksFromFirebase().subscribe({
      next: onTasksLoaded,
      error: onError
    });
  }
  /**
   * Sets up the scroll listener for thumbnail navigation.
   */
  setupScrollListener(): void {
    this.interactionService.setupScrollListener();
  }
  /**
   * Handles fragment navigation to scroll to specific columns.
   */
  handleFragmentNavigation(): void {
    this.navigationService.handleFragmentNavigation();
  }
  /**
   * Handles query parameters to open specific tasks or apply filters.
   * @param columnArrays - Object containing all column arrays
   * @param onTaskSelected - Callback when task is selected
   */
  handleQueryParams(
    columnArrays: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    },
    onTaskSelected: (task: Task) => void
  ): void {
    this.navigationService.handleQueryParams(columnArrays, onTaskSelected);
  }
}

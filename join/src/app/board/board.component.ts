import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Contact } from '../services/contact-data.service';
import { ContactsComponent } from '../contacts/contacts.component';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';
import { BoardDragDropService } from '../services/board-drag-drop.service';
import { BoardThumbnailService } from '../services/board-thumbnail.service';
import { BoardFormService } from '../services/board-form.service';
import { BoardUtilsService } from '../services/board-utils.service';
import { BoardDataService } from '../services/board-data.service';
import { TouchDetectionService } from '../services/touch-detection.service';
import { DeleteConfirmationService } from '../services/delete-confirmation.service';
import { TaskEditOverlayService } from '../services/task-edit-overlay.service';
import { ContactHelperService } from '../services/contact-helper.service';
import { MobileTaskMoveService } from '../services/mobile-task-move.service';
import { BoardTaskManagementService } from '../services/board-task-management.service';
import { BoardDisplayService } from '../services/board-display.service';
import { BoardInteractionService } from '../services/board-interaction.service';
import { BoardLifecycleService } from '../services/board-lifecycle.service';
import { DeleteConfirmationComponent } from './delete-confirmation/delete-confirmation.component';
import { TaskEditOverlayComponent } from './task-edit-overlay/task-edit-overlay.component';
import { AddTaskOverlayComponent } from './add-task-overlay/add-task-overlay.component';
import { BoardThumbnailComponent } from './board-thumbnail/board-thumbnail.component';
import { TaskDetailsOverlayComponent } from './task-details-overlay/task-details-overlay.component';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Main board component for task management with kanban-style columns.
 * Handles task creation, editing, deletion, card animation, and drag & drop functionality.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-board',
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule, DeleteConfirmationComponent, TaskEditOverlayComponent, AddTaskOverlayComponent, BoardThumbnailComponent, TaskDetailsOverlayComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  animations: [
    trigger('slideInRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('350ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class BoardComponent implements OnInit {
  contacts: Contact[] = [];
  searchTerm: string = '';
  maxTitleLength: number = 40;

  // Task arrays for different columns
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  awaitingFeedbackTasks: Task[] = [];
  doneTasks: Task[] = [];
  tasks: Task[] = [];

  // Board columns configuration
  boardColumns = [
    {
      id: 'todo' as TaskColumn,
      title: 'To Do',
      tasks: () => this.todoTasks,
      showAddButton: true,
      emptyMessage: 'No tasks to do',
    },
    {
      id: 'inprogress' as TaskColumn,
      title: 'In Progress',
      tasks: () => this.inProgressTasks,
      showAddButton: true,
      emptyMessage: 'No tasks in progress',
    },
    {
      id: 'awaiting' as TaskColumn,
      title: 'Awaiting feedback',
      tasks: () => this.awaitingFeedbackTasks,
      showAddButton: true,
      emptyMessage: 'No tasks awaiting feedback',
    },
    {
      id: 'done' as TaskColumn,
      title: 'Done',
      tasks: () => this.doneTasks,
      showAddButton: false,
      emptyMessage: 'No tasks done',
    },
  ];

  Math = Math;

  /**
   * Initializes the board component with all required services.
   *
   * @param taskService - Service for managing task data operations
   * @param dragDropService - Service for handling drag & drop functionality
   * @param thumbnailService - Service for thumbnail navigation
   * @param formService - Service for form management
   * @param utilsService - Service for utility functions
   * @param dataService - Service for data loading and organization
   * @param mobileService - Service for mobile interactions
   * @param subtaskService - Service for subtask management
   * @param touchDetectionService - Service for touch device detection
   */
  constructor(
    private taskService: TaskService,
    public dragDropService: BoardDragDropService,
    public thumbnailService: BoardThumbnailService,
    public formService: BoardFormService,
    public utilsService: BoardUtilsService,
    private dataService: BoardDataService,
    public touchDetectionService: TouchDetectionService,
    public deleteConfirmationService: DeleteConfirmationService,
    public taskEditOverlayService: TaskEditOverlayService,
    public contactHelperService: ContactHelperService,
    public mobileTaskMoveService: MobileTaskMoveService,
    public taskManagementService: BoardTaskManagementService,
    public displayService: BoardDisplayService,
    public interactionService: BoardInteractionService,
    public lifecycleService: BoardLifecycleService,
    private route: ActivatedRoute
  ) {
    this.initializeLocalArrays();
  }

  /** Angular lifecycle hook that runs after component initialization. */
  ngOnInit(): void {
    this.loadContactsData();
    this.loadTasksData();
    this.setupScrollListener();
    this.handleFragmentNavigation();
    this.handleQueryParams();
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
   * Sets up the scroll listener for thumbnail navigation.
   */
  private setupScrollListener(): void {
    setTimeout(() => {
      this.thumbnailService.setupScrollListener();
    }, 500);
  }

  /**
   * Loads contacts from Firebase and sorts them alphabetically.
   */
  private loadContactsData(): void {
    this.dataService.loadContactsFromFirebase().subscribe({
      next: (contacts: Contact[]) => {
        this.contacts = this.dataService.sortContactsAlphabetically(contacts);
      },
      error: (error: any) => {
        console.error('Error loading contacts:', error);
      }
    });
  }

  /**
   * Loads tasks from Firebase and subscribes to real-time updates.
   */
  private loadTasksData(): void {
    this.dataService.loadTasksFromFirebase().subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks;
        this.distributeTasksToColumns();
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  /** Distributes tasks into appropriate columns and sorts by priority. */
  private distributeTasksToColumns(): void {
    const distributed = this.taskManagementService.distributeAndSortTasks(this.tasks);
    this.assignTasksToColumns(distributed);
  }

  /** Assigns distributed tasks to component arrays. */
  private assignTasksToColumns(distributed: {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  }): void {
    this.todoTasks = distributed.todoTasks;
    this.inProgressTasks = distributed.inProgressTasks;
    this.awaitingFeedbackTasks = distributed.awaitingFeedbackTasks;
    this.doneTasks = distributed.doneTasks;
  }

  /** Initializes local task arrays from the task service. */
  private initializeLocalArrays(): void {
    this.updateLocalArrays();
  }

  /** Updates local task arrays with the latest data from the task service. */
  private updateLocalArrays(): void {
    this.todoTasks = this.utilsService.sortTasksByPriority(
      this.taskService.getTasksByColumn('todo')
    );
    this.inProgressTasks = this.utilsService.sortTasksByPriority(
      this.taskService.getTasksByColumn('inprogress')
    );
    this.awaitingFeedbackTasks = this.utilsService.sortTasksByPriority(
      this.taskService.getTasksByColumn('awaiting')
    );
    this.doneTasks = this.utilsService.sortTasksByPriority(
      this.taskService.getTasksByColumn('done')
    );
  }

  /** Safely truncates text to a maximum length. */
  truncate(text: string | null | undefined, limit: number = 200): string {
    return this.displayService.truncateText(text, limit);
  }

  /** Handles search input changes for task filtering. */
  onSearchChange(): void {
    // Search filtering is handled by the template via getFilteredTasks
    // This method is called when the search input value changes
  }

  /** Updates task arrays after task changes. */
  private updateTaskArrays(): void {
    const taskIndex = this.taskManagementService.findTaskIndex(this.tasks);
    if (taskIndex !== -1 && this.formService.selectedTask) {
      this.tasks = this.taskManagementService.updateTaskInArray(this.tasks, taskIndex);
    }
    this.distributeTasksToColumns();
  }

  // Task Management Service delegates
  /**
   * Opens the add task overlay for the specified column.
   * @param column - Target column for the new task
   */
  openAddTaskOverlay(column: TaskColumn = 'todo'): void {
    this.taskManagementService.openAddTaskOverlay(column);
  }

  /**
   * Closes the add task overlay.
   */
  closeAddTaskOverlay(): void {
    this.taskManagementService.closeAddTaskOverlay();
  }

  /**
   * Submits the task form and updates local arrays.
   */
  async onSubmit(): Promise<void> {
    await this.taskManagementService.submitTaskForm(() => {
      this.updateLocalArrays();
      this.distributeTasksToColumns();
    });
  }

  /**
   * Opens task details overlay for the specified task.
   * @param task - Task to display details for
   */
  openTaskDetails(task: Task): void {
    this.taskManagementService.openTaskDetails(task);
  }

  /**
   * Closes the task details overlay.
   */
  closeTaskDetailsOverlay(): void {
    this.taskManagementService.closeTaskDetailsOverlay();
  }

  /**
   * Enters edit mode for the selected task.
   */
  editTask(): void {
    this.taskManagementService.editTask(this.contacts);
  }

  /**
   * Cancels task editing and reverts changes.
   */
  cancelEditTask(): void {
    this.taskManagementService.cancelEditTask();
  }

  /**
   * Saves task changes and updates arrays.
   */
  async saveTaskChanges(): Promise<void> {
    await this.taskManagementService.saveTaskChanges(() => this.updateTaskArrays());
  }

  /**
   * Deletes the selected task and updates arrays.
   */
  async deleteTask(): Promise<void> {
    await this.taskManagementService.deleteTask();
  }

  /**
   * Confirms task deletion and updates arrays.
   */
  async confirmDeleteTask(): Promise<void> {
    await this.taskManagementService.confirmDeleteTask(() => {
      this.tasks = this.taskManagementService.removeTaskToDeleteFromArray(this.tasks);
      this.distributeTasksToColumns();
      this.taskManagementService.closeTaskDetailsOverlay();
    });
  }

  /**
   * Closes the delete confirmation dialog.
   */
  closeDeleteConfirmation(): void {
    this.taskManagementService.closeDeleteConfirmation();
  }

  /**
   * Toggles subtask completion status.
   * @param subtaskIndex - Index of the subtask to toggle
   */
  async toggleSubtask(subtaskIndex: number): Promise<void> {
    await this.taskManagementService.toggleSubtask(subtaskIndex, () =>
      this.updateTaskArrays()
    );
  }

  // Interaction Service delegates
  /** Handles mouse down on task for drag operation or details opening. */
  async onTaskMouseDown(event: MouseEvent, task: Task): Promise<void> {
    const wasDragged = await this.interactionService.handleTaskMouseDown(
      event,
      task,
      () => this.updateTaskArrays()
    );

    if (!wasDragged) {
      setTimeout(() => this.openTaskDetails(task), 0);
    }
  }

  /** Handles touch start on task for drag operation or details opening. */
  async onTaskTouchStart(event: TouchEvent, task: Task): Promise<void> {
    const wasDragged = await this.interactionService.handleTaskTouchStart(
      event,
      task,
      () => this.updateTaskArrays()
    );

    if (!wasDragged) {
      setTimeout(() => this.openTaskDetails(task), 0);
    }
  }

  /** Handles drag over event on columns. */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    this.interactionService.handleColumnDragOver(event, column);
  }

  /** Handles drag leave event on columns. */
  onColumnDragLeave(event: DragEvent): void {
    this.interactionService.handleColumnDragLeave(event);
  }

  /** Handles drop event on columns. */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    this.interactionService.handleColumnDrop(event, column);
  }

  // Thumbnail Service delegates
  /**
   * Handles thumbnail click events.
   * @param event - Mouse event
   */
  onThumbnailClick(event: MouseEvent): void {
    this.interactionService.handleThumbnailClick(event);
  }

  /**
   * Handles thumbnail touch start events for touch devices.
   * @param event - Touch event
   */
  onThumbnailTouchStart(event: TouchEvent): void {
    this.interactionService.handleThumbnailTouchStart(event);
  }

  /**
   * Handles viewport mouse down events.
   * @param event - Mouse event
   */
  onViewportMouseDown(event: MouseEvent): void {
    this.interactionService.handleViewportMouseDown(event);
  }

  /**
   * Handles viewport touch start events for touch devices.
   * @param event - Touch event
   */
  onViewportTouchStart(event: TouchEvent): void {
    this.interactionService.handleViewportTouchStart(event);
  }

  /**
   * Handles viewport click events.
   * @param event - Mouse event
   */
  onViewportClick(event: MouseEvent): void {
    this.interactionService.handleViewportClick(event);
  }

  // Display Service delegates
  /** Gets task completion progress as percentage. */
  getTaskProgress(task: Task): number {
    return this.displayService.getTaskProgress(task);
  }

  /** Gets number of completed subtasks. */
  getCompletedSubtasks(task: Task): number {
    return this.displayService.getCompletedSubtasks(task);
  }

  /** Gets priority icon path for a task. */
  getPriorityIcon(priority: Task['priority']): string {
    return this.displayService.getPriorityIcon(priority);
  }

  /** Gets filtered tasks based on search term. */
  getFilteredTasks(tasks: Task[]): Task[] {
    return this.displayService.getFilteredTasks(tasks, this.searchTerm);
  }

  /** Checks if there are no search results. */
  get noSearchResults(): boolean {
    return this.displayService.hasNoSearchResults(
      this.searchTerm,
      this.todoTasks,
      this.inProgressTasks,
      this.awaitingFeedbackTasks,
      this.doneTasks
    );
  }

  // Mobile Task Move Service delegates
  /** Shows mobile task move overlay. */
  onMobileMoveTask(event: MouseEvent | TouchEvent, task: Task): void {
    this.mobileTaskMoveService.onMobileMoveTask(event, task);
  }

  /** Closes the mobile move overlay. */
  closeMobileMoveOverlay(): void {
    this.mobileTaskMoveService.closeMobileMoveOverlay();
  }

  /** Gets the mobile move overlay visibility state. */
  get showMobileMoveOverlay(): boolean {
    return this.mobileTaskMoveService.showMobileMoveOverlay;
  }

  /** Gets the overlay position for mobile move dialog. */
  get overlayPosition(): { top: number; right: number } {
    return this.mobileTaskMoveService.overlayPosition;
  }

  /** Gets the currently selected task for moving. */
  get selectedTaskForMove(): Task | null {
    return this.mobileTaskMoveService.selectedTaskForMove;
  }

  /** Gets the current column of a task. */
  getCurrentTaskColumn(task: Task): TaskColumn | null {
    return this.mobileTaskMoveService.getCurrentTaskColumn(task, {
      todoTasks: this.todoTasks,
      inProgressTasks: this.inProgressTasks,
      awaitingFeedbackTasks: this.awaitingFeedbackTasks,
      doneTasks: this.doneTasks
    });
  }

  /** Gets the previous column for task movement. */
  getPreviousColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    return this.mobileTaskMoveService.getPreviousColumn(currentColumn);
  }

  /** Gets the next column for task movement. */
  getNextColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    return this.mobileTaskMoveService.getNextColumn(currentColumn);
  }

  /**
   * Gets column display name.
   * @param column - Column identifier
   * @returns Human-readable column name
   */
  getColumnDisplayName(column: TaskColumn): string {
    return this.mobileTaskMoveService.getColumnDisplayName(column);
  }

  /**
   * Handles mobile move button mouse down event.
   * @param event - Mouse event
   */
  onMobileMoveButtonMouseDown(event: MouseEvent): void {
    this.mobileTaskMoveService.onMobileMoveButtonMouseDown(event);
  }

  /**
   * Handles mobile move button touch start event.
   * @param event - Touch event
   * @param task - Task to move
   */
  onMobileMoveButtonTouchStart(event: TouchEvent, task: Task): void {
    this.mobileTaskMoveService.onMobileMoveButtonTouchStart(event, task);
  }

  /**
   * Moves selected task to previous column.
   */
  moveTaskToPreviousColumn(): void {
    this.mobileTaskMoveService.moveTaskToPreviousColumn(
      {
        todoTasks: this.todoTasks,
        inProgressTasks: this.inProgressTasks,
        awaitingFeedbackTasks: this.awaitingFeedbackTasks,
        doneTasks: this.doneTasks
      },
      (task: Task, fromColumn: TaskColumn | null, toColumn: TaskColumn) => {
        this.handleTaskMove(task, fromColumn, toColumn);
      }
    );
  }

  /**
   * Moves selected task to next column.
   */
  moveTaskToNextColumn(): void {
    this.mobileTaskMoveService.moveTaskToNextColumn(
      {
        todoTasks: this.todoTasks,
        inProgressTasks: this.inProgressTasks,
        awaitingFeedbackTasks: this.awaitingFeedbackTasks,
        doneTasks: this.doneTasks
      },
      (task: Task, fromColumn: TaskColumn | null, toColumn: TaskColumn) => {
        this.handleTaskMove(task, fromColumn, toColumn);
      }
    );
  }

  /**
   * Handles task movement between columns.
   * @param task - Task being moved
   * @param fromColumn - Source column
   * @param toColumn - Target column
   */
  private handleTaskMove(task: Task, fromColumn: TaskColumn | null, toColumn: TaskColumn): void {
    const currentColumns = {
      todoTasks: this.todoTasks,
      inProgressTasks: this.inProgressTasks,
      awaitingFeedbackTasks: this.awaitingFeedbackTasks,
      doneTasks: this.doneTasks
    };

    // Remove from current column if exists
    let updatedColumns = currentColumns;
    if (fromColumn) {
      updatedColumns = this.taskManagementService.removeTaskFromColumn(task, fromColumn, updatedColumns);
    }
    
    // Add to target column
    updatedColumns = this.taskManagementService.addTaskToColumn(task, toColumn, updatedColumns);
    
    // Update component arrays
    this.todoTasks = updatedColumns.todoTasks;
    this.inProgressTasks = updatedColumns.inProgressTasks;
    this.awaitingFeedbackTasks = updatedColumns.awaitingFeedbackTasks;
    this.doneTasks = updatedColumns.doneTasks;
  }

  /**
   * Gets displayed contacts for task assignment.
   * @param assignedContacts - Array of assigned contact names
   * @returns Array of contacts to display
   */
  getDisplayedContacts(assignedContacts: string[]): Contact[] {
    return this.contactHelperService.getDisplayedContacts(assignedContacts, this.contacts);
  }

  /**
   * Checks if there are remaining contacts not displayed.
   * @param assignedContacts - Array of assigned contact names
   * @returns True if there are remaining contacts
   */
  hasRemainingContacts(assignedContacts: string[]): boolean {
    return this.contactHelperService.hasRemainingContacts(assignedContacts, this.contacts);
  }

  /**
   * Gets count of remaining contacts not displayed.
   * @param assignedContacts - Array of assigned contact names
   * @returns Number of remaining contacts
   */
  getRemainingContactsCount(assignedContacts: string[]): number {
    return this.contactHelperService.getRemainingContactsCount(assignedContacts, this.contacts);
  }

  /**
   * Gets initials from contact name for avatar display.
   * @param name - Full name of the contact
   * @returns Initials (first letter of first and last name)
   */
  getInitials(name: string): string {
    return this.contactHelperService.getInitials(name);
  }

  /**
   * Gets background color for contact avatar based on name.
   * @param name - Full name of the contact
   * @returns Hex color string
   */
  getInitialsColor(name: string): string {
    return this.contactHelperService.getInitialsColor(name);
  }

  /**
   * Handles query parameters to open specific tasks or apply filters.
   */
  private handleQueryParams(): void {
    this.lifecycleService.handleQueryParams(
      {
        todoTasks: this.todoTasks,
        inProgressTasks: this.inProgressTasks,
        awaitingFeedbackTasks: this.awaitingFeedbackTasks,
        doneTasks: this.doneTasks
      },
      (task: Task) => this.openTaskDetails(task)
    );
  }
}

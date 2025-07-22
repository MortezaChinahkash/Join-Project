import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Contact } from '../contacts/services/contact-data.service';
import { ContactsComponent } from '../contacts/contacts.component';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { TaskService } from '../shared/services/task.service';
import { BoardDragDropService } from './services/board-drag-drop.service';
import { BoardThumbnailService } from './services/board-thumbnail.service';
import { BoardFormService } from './services/board-form.service';
import { BoardUtilsService } from './services/board-utils.service';
import { BoardDataService } from './services/board-data.service';
import { TouchDetectionService } from '../shared/services/touch-detection.service';
import { DeleteConfirmationService } from '../shared/services/delete-confirmation.service';
import { TaskEditOverlayService } from './services/task-edit-overlay.service';
import { ContactHelperService } from '../contacts/services/contact-helper.service';
import { MobileTaskMoveService } from './services/mobile-task-move.service';
import { BoardTaskManagementService } from './services/board-task-management.service';
import { BoardDisplayService } from './services/board-display.service';
import { BoardInteractionService } from './services/board-interaction.service';
import { BoardLifecycleService } from './services/board-lifecycle.service';
import { BoardInitializationService } from './services/board-initialization.service';
import { BoardArrayManagementService } from './services/board-array-management.service';
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
        /** Initial state for slide-in animation from right */
        style({ transform: 'translateX(100%)', opacity: 0 }),
        /** Animation to slide element into view */
        animate('350ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        /** Animation to slide element out of view to the right */
        animate('200ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class BoardComponent implements OnInit, OnDestroy {
  contacts: Contact[] = [];
  searchTerm: string = '';
  maxTitleLength: number = 40;
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  awaitingFeedbackTasks: Task[] = [];
  doneTasks: Task[] = [];
  tasks: Task[] = [];
  boardColumns = [
    {
      id: 'todo' as TaskColumn,
      title: 'To Do',
      /** Returns todo tasks array */
      tasks: () => this.todoTasks,
      showAddButton: true,
      emptyMessage: 'No tasks to do',
    },
    {
      id: 'inprogress' as TaskColumn,
      title: 'In Progress',
      /** Returns in progress tasks array */
      tasks: () => this.inProgressTasks,
      showAddButton: true,
      emptyMessage: 'No tasks in progress',
    },
    {
      id: 'awaiting' as TaskColumn,
      title: 'Awaiting feedback',
      /** Returns awaiting feedback tasks array */
      tasks: () => this.awaitingFeedbackTasks,
      showAddButton: true,
      emptyMessage: 'No tasks awaiting feedback',
    },
    {
      id: 'done' as TaskColumn,
      title: 'Done',
      /** Returns done tasks array */
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
    public initializationService: BoardInitializationService,
    public arrayManagementService: BoardArrayManagementService,
    private route: ActivatedRoute
  ) {
    this.initializeLocalArrays();
  }

  /** Angular lifecycle hook that runs after component initialization. */
  /**
   * Angular lifecycle hook - component initialization.
   */
  ngOnInit(): void {
    this.initializationService.initializeComponent(
      (contacts) => { this.contacts = contacts; },

      (tasks) => {
        this.tasks = tasks;
        this.distributeTasksToColumns();
      },

      () => {}

    );
  }

  /** Distributes tasks into appropriate columns and sorts by priority. */
  /**
   * Handles distributeTasksToColumns functionality.
   */
  private distributeTasksToColumns(): void {
    const distributed = this.initializationService.distributeAndSortTasks(this.tasks);
    const assigned = this.arrayManagementService.assignTasksToColumns(distributed);
    this.assignTasksToColumns(assigned);
    setTimeout(() => this.handleQueryParams(), 50);
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
  /**
   * Handles initializeLocalArrays functionality.
   */
  private initializeLocalArrays(): void {
    const initialized = this.initializationService.initializeTaskArrays();
    this.assignTasksToColumns(initialized);
  }

  /** Updates task arrays after task changes. */
  /**
   * Updates taskarrays.
   */
  private updateTaskArrays(): void {
    this.arrayManagementService.updateTaskArrays(
      this.tasks,
      this.formService.selectedTask,
      (updatedTasks) => { this.tasks = updatedTasks; },

      () => this.distributeTasksToColumns()
    );
  }
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
    console.log('🎯 Board onSubmit called');
    await this.taskManagementService.submitTaskForm(() => {
      console.log('🔄 Reinitializing local arrays');
      this.initializeLocalArrays();
    });
    console.log('✅ Board onSubmit completed');
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

  /** Safely truncates text to a maximum length. */
  /**
   * Handles truncate functionality.
   * @param text - Text parameter
   * @param limit - Limit parameter
   * @returns String result
   */
  truncate(text: string | null | undefined, limit: number = 200): string {
    return this.displayService.truncateText(text, limit);
  }

  /** Handles search input changes for task filtering. */
  /**
   * Handles searchchange events.
   */
  onSearchChange(): void {
  }

  /**
   * Handles taskmousedown events.
   * @param event - Event parameter
   * @param task - Task parameter
   * @returns Promise that resolves when operation completes
   */
  async onTaskMouseDown(event: MouseEvent, task: Task): Promise<void> {
    const wasDragged = await this.interactionService.handleTaskMouseDown(event, task, () => this.updateTaskArrays());
    if (!wasDragged) setTimeout(() => this.openTaskDetails(task), 0);
  }

  /**
   * Handles tasktouchstart events.
   * @param event - Event parameter
   * @param task - Task parameter
   * @returns Promise that resolves when operation completes
   */
  async onTaskTouchStart(event: TouchEvent, task: Task): Promise<void> {
    const wasDragged = await this.interactionService.handleTaskTouchStart(event, task, () => this.updateTaskArrays());
    if (!wasDragged) setTimeout(() => this.openTaskDetails(task), 0);
  }

  /** Handles column drag over events */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void { this.interactionService.handleColumnDragOver(event, column); }

  /** Handles column drag leave events */
  onColumnDragLeave(event: DragEvent): void { this.interactionService.handleColumnDragLeave(event); }

  /** Handles column drop events */
  onColumnDrop(event: DragEvent, column: TaskColumn): void { this.interactionService.handleColumnDrop(event, column); }

  /** Handles thumbnail click events */
  onThumbnailClick(event: MouseEvent): void { this.interactionService.handleThumbnailClick(event); }

  /** Handles thumbnail touch start events */
  onThumbnailTouchStart(event: TouchEvent): void { this.interactionService.handleThumbnailTouchStart(event); }

  /** Handles viewport mouse down events */
  onViewportMouseDown(event: MouseEvent): void { this.interactionService.handleViewportMouseDown(event); }

  /** Handles viewport touch start events */
  onViewportTouchStart(event: TouchEvent): void { this.interactionService.handleViewportTouchStart(event); }

  /** Handles viewport click events */
  onViewportClick(event: MouseEvent): void { this.interactionService.handleViewportClick(event); }

  /** Gets task progress percentage */
  getTaskProgress(task: Task): number { return this.displayService.getTaskProgress(task); }

  /** Gets number of completed subtasks */
  getCompletedSubtasks(task: Task): number { return this.displayService.getCompletedSubtasks(task); }

  /** Gets priority icon name for task priority */
  getPriorityIcon(priority: Task['priority']): string { return this.displayService.getPriorityIcon(priority); }

  /** Gets filtered tasks based on search term */
  getFilteredTasks(tasks: Task[]): Task[] { return this.displayService.getFilteredTasks(tasks, this.searchTerm); }

  /** Checks if there are no search results */
  get noSearchResults(): boolean {
    return this.displayService.hasNoSearchResults(this.searchTerm, this.todoTasks, this.inProgressTasks, this.awaitingFeedbackTasks, this.doneTasks);
  }

  /** Handles mobile task move events */
  onMobileMoveTask(event: MouseEvent | TouchEvent, task: Task): void { this.mobileTaskMoveService.onMobileMoveTask(event, task); }

  /** Closes mobile move overlay */
  closeMobileMoveOverlay(): void { this.mobileTaskMoveService.closeMobileMoveOverlay(); }

  /** Gets mobile move overlay visibility status */
  get showMobileMoveOverlay(): boolean { return this.mobileTaskMoveService.showMobileMoveOverlay; }

  /** Gets mobile move overlay position */
  get overlayPosition(): { top: number; right: number } { return this.mobileTaskMoveService.overlayPosition; }

  /** Gets selected task for mobile move */
  get selectedTaskForMove(): Task | null { return this.mobileTaskMoveService.selectedTaskForMove; }

  /**
   * Gets currenttaskcolumn value.
   * @param task - Task parameter
   * @returns TaskColumn | null
   */
  getCurrentTaskColumn(task: Task): TaskColumn | null {
    return this.mobileTaskMoveService.getCurrentTaskColumn(task, {
      todoTasks: this.todoTasks, inProgressTasks: this.inProgressTasks,
      awaitingFeedbackTasks: this.awaitingFeedbackTasks, doneTasks: this.doneTasks
    });
  }

  /** Gets previous column in workflow */
  getPreviousColumn(currentColumn: TaskColumn | null): TaskColumn | null { return this.mobileTaskMoveService.getPreviousColumn(currentColumn); }

  /** Gets next column in workflow */
  getNextColumn(currentColumn: TaskColumn | null): TaskColumn | null { return this.mobileTaskMoveService.getNextColumn(currentColumn); }

  /** Gets display name for column */
  getColumnDisplayName(column: TaskColumn): string { return this.mobileTaskMoveService.getColumnDisplayName(column); }

  /** Handles mobile move button mouse down events */
  onMobileMoveButtonMouseDown(event: MouseEvent): void { this.mobileTaskMoveService.onMobileMoveButtonMouseDown(event); }

  /** Handles mobile move button touch start events */
  onMobileMoveButtonTouchStart(event: TouchEvent, task: Task): void { this.mobileTaskMoveService.onMobileMoveButtonTouchStart(event, task); }

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
    const updatedColumns = this.arrayManagementService.handleTaskMovement(
      task,
      fromColumn,
      toColumn,
      {
        todoTasks: this.todoTasks,
        inProgressTasks: this.inProgressTasks,
        awaitingFeedbackTasks: this.awaitingFeedbackTasks,
        doneTasks: this.doneTasks
      }
    );
    this.assignTasksToColumns(updatedColumns);
  }

  /** Gets displayed contacts for task */
  getDisplayedContacts(assignedContacts: string[]): Contact[] { return this.contactHelperService.getDisplayedContacts(assignedContacts, this.contacts); }

  /** Checks if there are remaining contacts not displayed */
  hasRemainingContacts(assignedContacts: string[]): boolean { return this.contactHelperService.hasRemainingContacts(assignedContacts, this.contacts); }

  /** Gets count of remaining contacts not displayed */
  getRemainingContactsCount(assignedContacts: string[]): number { return this.contactHelperService.getRemainingContactsCount(assignedContacts, this.contacts); }

  /** Gets initials for contact name */
  getInitials(name: string): string { return this.contactHelperService.getInitials(name); }

  /** Gets color for contact initials */
  getInitialsColor(name: string): string { return this.contactHelperService.getInitialsColor(name); }

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
  
  /**
   * Angular lifecycle hook that runs when component is destroyed.
   */
  ngOnDestroy(): void {
    this.dragDropService.emergencyCleanup();
  }
  
  /**
   * Host listener for window blur event to restore board scroll wrapper.
   */
  @HostListener('window:blur')
  /**
   * Handles windowblur events.
   */
  onWindowBlur(): void {
    this.dragDropService.emergencyCleanup();
  }
  
  /**
   * Host listener for escape key to cancel drag and restore board scroll wrapper.
   */
  @HostListener('document:keydown.escape')
  /**
   * Handles escapekey events.
   */
  onEscapeKey(): void {
    this.dragDropService.emergencyCleanup();
  }
  
  /**
   * Host listener for visibility change to restore board scroll wrapper.
   */
  @HostListener('document:visibilitychange')
  /**
   * Handles visibilitychange events.
   */
  onVisibilityChange(): void {
    if (document.hidden) {
      this.dragDropService.emergencyCleanup();
    }
  }
}

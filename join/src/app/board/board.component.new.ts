import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Contact, ContactsComponent } from '../contacts/contacts.component';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';
import { BoardDragDropService } from '../services/board-drag-drop.service';
import { BoardThumbnailService } from '../services/board-thumbnail.service';
import { BoardFormService } from '../services/board-form.service';
import { BoardUtilsService } from '../services/board-utils.service';
import { BoardDataService } from '../services/board-data.service';
import { BoardMobileService } from '../services/board-mobile.service';
import { BoardSubtaskService } from '../services/board-subtask.service';

/**
 * Main board component for task management with kanban-style columns.
 * Handles task creation, editing, deletion, and drag & drop functionality.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-board',
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit {
  contacts: Contact[] = [];
  searchTerm: string = '';
  newSubtaskTitle: string = '';
  maxTitleLength: number = 40;
  editingSubtaskIndex: number | null = null;

  // Mobile move overlay state
  showMobileMoveOverlay: boolean = false;
  selectedTaskForMove: Task | null = null;
  overlayPosition = { top: 0, right: 0 };

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
   */
  constructor(
    private taskService: TaskService,
    public dragDropService: BoardDragDropService,
    public thumbnailService: BoardThumbnailService,
    public formService: BoardFormService,
    public utilsService: BoardUtilsService,
    private dataService: BoardDataService,
    private mobileService: BoardMobileService,
    private subtaskService: BoardSubtaskService
  ) {
    this.initializeLocalArrays();
  }

  /**
   * Angular lifecycle hook that runs after component initialization.
   */
  ngOnInit(): void {
    this.loadContactsData();
    this.loadTasksData();
    this.setupScrollListener();
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
      next: (contacts) => {
        this.contacts = this.dataService.sortContactsAlphabetically(contacts);
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
      }
    });
  }

  /**
   * Loads tasks from Firebase and subscribes to real-time updates.
   */
  private loadTasksData(): void {
    this.dataService.loadTasksFromFirebase().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.distributeTasksToColumns();
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  /**
   * Distributes tasks into appropriate columns and sorts by priority.
   */
  private distributeTasksToColumns(): void {
    const distributed = this.dataService.distributeTasksToColumns(this.tasks);
    this.assignTasksToColumns(distributed);
  }

  /**
   * Assigns distributed tasks to component arrays.
   * @param distributed - Object containing tasks organized by column
   */
  private assignTasksToColumns(distributed: {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  }): void {
    this.todoTasks = this.utilsService.sortTasksByPriority(distributed.todoTasks);
    this.inProgressTasks = this.utilsService.sortTasksByPriority(distributed.inProgressTasks);
    this.awaitingFeedbackTasks = this.utilsService.sortTasksByPriority(distributed.awaitingFeedbackTasks);
    this.doneTasks = this.utilsService.sortTasksByPriority(distributed.doneTasks);
  }

  /**
   * Initializes local task arrays from the task service.
   */
  private initializeLocalArrays(): void {
    this.updateLocalArrays();
  }

  /**
   * Updates local task arrays with the latest data from the task service.
   */
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

  /**
   * Gets the initials from a contact name.
   * @param name - The full name of the contact
   * @returns The initials (first letters of first and last name)
   */
  getInitials(name: string): string {
    return ContactsComponent.getInitials(name);
  }

  /**
   * Gets a deterministic color for a contact based on their name.
   * @param name - The full name of the contact
   * @returns A CSS color string for the contact's avatar
   */
  getInitialsColor(name: string): string {
    return ContactsComponent.getInitialsColor(name);
  }

  /**
   * Handles search input changes.
   */
  onSearchChange(): void {
    // Search filtering is handled by the template via getFilteredTasks
  }

  /**
   * Safely truncates text to a maximum length.
   * @param text - Text to truncate
   * @param limit - Maximum length
   * @returns Truncated text with ellipsis if needed
   */
  truncate(text: string | null | undefined, limit: number = 200): string {
    const content = text ?? '';
    if (content.length <= limit) {
      return content;
    }
    return content.slice(0, limit) + '…';
  }

  /**
   * Updates task arrays after task changes.
   */
  private updateTaskArrays(): void {
    const taskIndex = this.findTaskIndex();
    if (taskIndex !== -1 && this.formService.selectedTask) {
      this.updateTaskInArray(taskIndex);
    }
    this.distributeTasksToColumns();
  }

  /**
   * Finds the index of the currently selected task.
   * @returns Index of task or -1 if not found
   */
  private findTaskIndex(): number {
    return this.tasks.findIndex(
      (t) => t.id === this.formService.selectedTask?.id
    );
  }

  /**
   * Updates a task in the tasks array.
   * @param taskIndex - Index of task to update
   */
  private updateTaskInArray(taskIndex: number): void {
    if (this.formService.selectedTask) {
      this.tasks[taskIndex] = this.formService.selectedTask;
  }

  /**
   * Removes the selected task from the tasks array.
   */
  private removeTaskFromArray(): void {
    this.tasks = this.tasks.filter(
      (t) => t.id !== this.formService.selectedTask!.id
    );
  }

  /**
   * Removes the task to delete from the tasks array.
   */
  private removeTaskToDeleteFromArray(): void {
    this.tasks = this.tasks.filter(
      (t) => t.id !== this.formService.taskToDelete!.id
    );
  }

  // Form Service delegates
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
   * Submits the task form and updates local arrays.
   */
  async onSubmit(): Promise<void> {
    await this.formService.onSubmit(() => {
      this.updateLocalArrays();
      this.distributeTasksToColumns();
    });
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
   */
  editTask(): void {
    this.formService.editTask(this.contacts);
  }

  /**
   * Cancels task editing and reverts changes.
   */
  cancelEditTask(): void {
    this.formService.cancelEditTask();
  }

  /**
   * Saves task changes and updates arrays.
   */
  async saveTaskChanges(): Promise<void> {
    await this.formService.saveTaskChanges(() => this.updateTaskArrays());
  }

  /**
   * Deletes the selected task and updates arrays.
   */
  async deleteTask(): Promise<void> {
    await this.formService.deleteTask(() => {
      this.removeTaskFromArray();
      this.distributeTasksToColumns();
    });
  }

  /**
   * Confirms task deletion and updates arrays.
   */
  async confirmDeleteTask(): Promise<void> {
    await this.formService.confirmDeleteTask(() => {
      this.removeTaskToDeleteFromArray();
      this.distributeTasksToColumns();
    });
  }

  /**
   * Closes the delete confirmation dialog.
   */
  closeDeleteConfirmation(): void {
    this.formService.closeDeleteConfirmation();
  }

  /**
   * Toggles subtask completion status.
   * @param subtaskIndex - Index of the subtask to toggle
   */
  async toggleSubtask(subtaskIndex: number): Promise<void> {
    await this.formService.toggleSubtask(subtaskIndex, () =>
      this.updateTaskArrays()
    );
  }

  // Drag & Drop Service delegates
  /**
   * Handles mouse down on task for drag operation or details opening.
   * @param event - Mouse event
   * @param task - Task being interacted with
   */
  async onTaskMouseDown(event: MouseEvent, task: Task): Promise<void> {
    const wasDragged = await this.dragDropService.onTaskMouseDown(
      event,
      task,
      () => this.updateTaskArrays()
    );

    if (!wasDragged) {
      setTimeout(() => this.openTaskDetails(task), 0);
    }
  }

  /**
   * Handles touch start on task for drag operation or details opening.
   * @param event - Touch event
   * @param task - Task being interacted with
   */
  async onTaskTouchStart(event: TouchEvent, task: Task): Promise<void> {
    const wasDragged = await this.dragDropService.onTaskTouchStart(
      event,
      task,
      () => this.updateTaskArrays()
    );

    if (!wasDragged) {
      setTimeout(() => this.openTaskDetails(task), 0);
    }
  }

  /**
   * Handles drag over event on columns.
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    this.dragDropService.onColumnDragOver(event, column);
  }

  /**
   * Handles drag leave event on columns.
   * @param event - Drag event
   */
  onColumnDragLeave(event: DragEvent): void {
    this.dragDropService.onColumnDragLeave(event);
  }

  /**
   * Handles drop event on columns.
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    this.dragDropService.onColumnDrop(event, column);
  }

  // Thumbnail Service delegates
  /**
   * Handles thumbnail click events.
   * @param event - Mouse event
   */
  onThumbnailClick(event: MouseEvent): void {
    this.thumbnailService.onThumbnailClick(event);
  }

  /**
   * Handles viewport mouse down events.
   * @param event - Mouse event
   */
  onViewportMouseDown(event: MouseEvent): void {
    this.thumbnailService.onViewportMouseDown(event);
  }

  /**
   * Handles viewport click events.
   * @param event - Mouse event
   */
  onViewportClick(event: MouseEvent): void {
    this.thumbnailService.onViewportClick(event);
  }

  // Utils Service delegates
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

  /**
   * Gets filtered tasks based on search term.
   * @param tasks - Tasks to filter
   * @returns Filtered tasks array
   */
  getFilteredTasks(tasks: Task[]): Task[] {
    return this.utilsService.getFilteredTasks(tasks, this.searchTerm);
  }

  /**
   * Checks if there are no search results.
   * @returns True if no tasks match search criteria
   */
  get noSearchResults(): boolean {
    return this.utilsService.hasNoSearchResults(
      this.searchTerm,
      this.todoTasks,
      this.inProgressTasks,
      this.awaitingFeedbackTasks,
      this.doneTasks
    );
  }

  /**
   * Focuses on a specific subtask input field for editing.
   * @param index - Index of the subtask to edit
   */
  editSubtask(index: number): void {
    this.editingSubtaskIndex = index;
    this.subtaskService.focusSubtaskInput(index);
  }

  /**
   * Adds a new subtask to the form array.
   */
  addNewSubtask(): void {
    this.subtaskService.addSubtaskToForm(
      this.newSubtaskTitle,
      this.formService.subtasksFormArray,
      this.formService.createSubtaskGroup.bind(this.formService)
    );
    this.newSubtaskTitle = '';
  }

  /**
   * Shows mobile task move overlay.
   * @param event - Click event
   * @param task - Task to move
   */
  onMobileMoveTask(event: MouseEvent, task: Task): void {
    event.stopPropagation();
    
    const button = event.currentTarget as HTMLElement;
    this.overlayPosition = this.mobileService.calculateOverlayPosition(button);
    this.selectedTaskForMove = task;
    this.showMobileMoveOverlay = true;
  }

  /**
   * Closes the mobile move overlay.
   */
  closeMobileMoveOverlay(): void {
    this.showMobileMoveOverlay = false;
    this.selectedTaskForMove = null;
    this.overlayPosition = { top: 0, right: 0 };
  }

  /**
   * Gets column display name.
   * @param column - Column identifier
   * @returns Human-readable column name
   */
  getColumnDisplayName(column: TaskColumn): string {
    return this.mobileService.getColumnDisplayName(column);
  }
}
}

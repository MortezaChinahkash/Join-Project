import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
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
import { BoardMobileService } from '../services/board-mobile.service';
import { BoardSubtaskService } from '../services/board-subtask.service';
import { trigger, transition, style, animate } from '@angular/animations';

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
   * Handles search input changes for task filtering.
   */
  onSearchChange(): void {
    // Search filtering is handled by the template via getFilteredTasks
    // This method is called when the search input value changes
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

  /**
   * Handles mobile move button mouse down event.
   * @param event - Mouse event
   */
  onMobileMoveButtonMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handles mobile move button touch start event.
   * @param event - Touch event
   */
  onMobileMoveButtonTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Gets displayed contacts for task assignment.
   * @param assignedContacts - Array of assigned contact names
   * @returns Array of contacts to display
   */
  getDisplayedContacts(assignedContacts: string[]): Contact[] {
    const maxDisplay = 3;
    const contacts = assignedContacts
      .map(name => this.contacts.find(c => c.name === name))
      .filter(contact => contact !== undefined) as Contact[];
    return contacts.slice(0, maxDisplay);
  }

  /**
   * Checks if there are remaining contacts not displayed.
   * @param assignedContacts - Array of assigned contact names
   * @returns True if there are remaining contacts
   */
  hasRemainingContacts(assignedContacts: string[]): boolean {
    const maxDisplay = 3;
    const contactCount = assignedContacts
      .map(name => this.contacts.find(c => c.name === name))
      .filter(contact => contact !== undefined).length;
    return contactCount > maxDisplay;
  }

  /**
   * Gets count of remaining contacts not displayed.
   * @param assignedContacts - Array of assigned contact names
   * @returns Number of remaining contacts
   */
  getRemainingContactsCount(assignedContacts: string[]): number {
    const maxDisplay = 3;
    const contactCount = assignedContacts
      .map(name => this.contacts.find(c => c.name === name))
      .filter(contact => contact !== undefined).length;
    return Math.max(0, contactCount - maxDisplay);
  }

  /**
   * Gets initials from contact name for avatar display.
   * @param name - Full name of the contact
   * @returns Initials (first letter of first and last name)
   */
  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Gets background color for contact avatar based on name.
   * Uses the same color logic as the contacts component.
   * @param name - Full name of the contact
   * @returns Hex color string
   */
  getInitialsColor(name: string): string {
    if (!name?.trim()) return '#888';
    
    // Same color palette as ContactOrganizationService
    const colors = [
      '#FFB900', '#D83B01', '#B50E0E', '#E81123',
      '#B4009E', '#5C2D91', '#0078D7', '#00B4FF',
      '#008272', '#107C10', '#7FBA00', '#F7630C',
      '#CA5010', '#EF6950', '#E74856', '#0099BC',
      '#7A7574', '#767676', '#FF8C00', '#E3008C',
      '#68217A', '#00188F', '#00BCF2', '#00B294',
      '#BAD80A', '#FFF100',
    ];
    
    // Same calculation logic as ContactOrganizationService
    const letter = name.trim()[0].toUpperCase();
    const colorIndex = letter.charCodeAt(0) - 65; // A=0, B=1, etc.
    return colors[colorIndex % colors.length];
  }

  /**
   * Gets current column of selected task.
   * @param task - Task to check
   * @returns Current column or null
   */
  getCurrentTaskColumn(task: Task | null): TaskColumn | null {
    if (!task) return null;
    return this.mobileService.getCurrentTaskColumn(task, {
      todoTasks: this.todoTasks,
      inProgressTasks: this.inProgressTasks,
      awaitingFeedbackTasks: this.awaitingFeedbackTasks,
      doneTasks: this.doneTasks
    });
  }

  /**
   * Gets previous column in workflow.
   * @param currentColumn - Current column
   * @returns Previous column or null
   */
  getPreviousColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    if (!currentColumn) return null;
    return this.mobileService.getPreviousColumn(currentColumn);
  }

  /**
   * Gets next column in workflow.
   * @param currentColumn - Current column
   * @returns Next column or null
   */
  getNextColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    if (!currentColumn) return null;
    return this.mobileService.getNextColumn(currentColumn);
  }

  /**
   * Moves selected task to previous column.
   */
  moveTaskToPreviousColumn(): void {
    if (!this.selectedTaskForMove) return;
    
    const currentColumn = this.getCurrentTaskColumn(this.selectedTaskForMove);
    const previousColumn = this.getPreviousColumn(currentColumn);
    
    if (previousColumn) {
      this.moveTaskToColumn(this.selectedTaskForMove, previousColumn);
    }
  }

  /**
   * Moves selected task to next column.
   */
  moveTaskToNextColumn(): void {
    if (!this.selectedTaskForMove) return;
    
    const currentColumn = this.getCurrentTaskColumn(this.selectedTaskForMove);
    const nextColumn = this.getNextColumn(currentColumn);
    
    if (nextColumn) {
      this.moveTaskToColumn(this.selectedTaskForMove, nextColumn);
    }
  }

  /**
   * Moves task to specified column.
   * @param task - Task to move
   * @param targetColumn - Target column
   */
  private moveTaskToColumn(task: Task, targetColumn: TaskColumn): void {
    // Remove from current column
    this.removeTaskFromCurrentColumn(task);
    
    // Add to target column
    task.column = targetColumn;
    this.addTaskToColumn(task, targetColumn);
    
    // Update task in database
    if (task.id) {
      this.taskService.updateTask(task.id, { column: targetColumn });
    }
    
    // Close overlay
    this.showMobileMoveOverlay = false;
    this.selectedTaskForMove = null;
  }

  /**
   * Removes task from its current column.
   * @param task - Task to remove
   */
  private removeTaskFromCurrentColumn(task: Task): void {
    const currentColumn = this.getCurrentTaskColumn(task);
    
    switch (currentColumn) {
      case 'todo':
        this.todoTasks = this.todoTasks.filter(t => t.id !== task.id);
        break;
      case 'inprogress':
        this.inProgressTasks = this.inProgressTasks.filter(t => t.id !== task.id);
        break;
      case 'awaiting':
        this.awaitingFeedbackTasks = this.awaitingFeedbackTasks.filter(t => t.id !== task.id);
        break;
      case 'done':
        this.doneTasks = this.doneTasks.filter(t => t.id !== task.id);
        break;
    }
  }

  /**
   * Adds task to specified column.
   * @param task - Task to add
   * @param column - Target column
   */
  private addTaskToColumn(task: Task, column: TaskColumn): void {
    switch (column) {
      case 'todo':
        this.todoTasks.push(task);
        break;
      case 'inprogress':
        this.inProgressTasks.push(task);
        break;
      case 'awaiting':
        this.awaitingFeedbackTasks.push(task);
        break;
      case 'done':
        this.doneTasks.push(task);
        break;
    }
  }
}

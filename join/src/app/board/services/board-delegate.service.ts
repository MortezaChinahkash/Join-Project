import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';
import { BoardTaskManagementService } from './board-task-management.service';
import { BoardDisplayService } from './board-display.service';
import { MobileTaskMoveService } from './mobile-task-move.service';
import { ContactHelperService } from '../../contacts/services/contact-helper.service';

/**
 * Service for handling all board component delegate methods.
 * Reduces component complexity by centralizing method calls.
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDelegateService {

  /**
   * Initializes the board delegate service with required dependencies.
   * 
   * @param taskManagementService - Service for managing task operations
   * @param displayService - Service for display-related operations  
   * @param mobileTaskMoveService - Service for mobile task movement
   * @param contactHelperService - Service for contact helper operations
   */
  constructor(
    private taskManagementService: BoardTaskManagementService,
    private displayService: BoardDisplayService,
    private mobileTaskMoveService: MobileTaskMoveService,
    private contactHelperService: ContactHelperService
  ) {}

  // Task Management Delegation
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
   * Opens the task details overlay for a specific task.
   * 
   * @param task - The task to display details for
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
   * Initiates editing mode for the current task.
   * 
   * @param contacts - Array of available contacts for assignment
   */
  editTask(contacts: Contact[]): void {
    this.taskManagementService.editTask(contacts);
  }

  /**
   * Cancels the current task editing operation.
   */
  cancelEditTask(): void {
    this.taskManagementService.cancelEditTask();
  }

  /**
   * Deletes the currently selected task.
   * 
   * @returns Promise that resolves when deletion is complete
   */
  async deleteTask(): Promise<void> {
    await this.taskManagementService.deleteTask();
  }

  /**
   * Closes the delete confirmation dialog.
   */
  closeDeleteConfirmation(): void {
    this.taskManagementService.closeDeleteConfirmation();
  }

  async submitTaskForm(initCallback: () => void): Promise<void> {
    await this.taskManagementService.submitTaskForm(() => {
      initCallback();
    });
  }

  async saveTaskChanges(updateCallback: () => void): Promise<void> {
    await this.taskManagementService.saveTaskChanges(updateCallback);
  }

  async confirmDeleteTask(cleanupCallback: () => void): Promise<void> {
    await this.taskManagementService.confirmDeleteTask(cleanupCallback);
  }

  async toggleSubtask(subtaskIndex: number, updateCallback: () => void): Promise<void> {
    await this.taskManagementService.toggleSubtask(subtaskIndex, updateCallback);
  }

  // Display Service Delegation
  truncate(text: string | null | undefined, limit: number = 200): string {
    return this.displayService.truncateText(text, limit);
  }

  /**
   * Calculates and returns the progress percentage of a task based on completed subtasks.
   * 
   * @param task - The task to calculate progress for
   * @returns Progress percentage as a number between 0 and 100
   */
  getTaskProgress(task: Task): number {
    return this.displayService.getTaskProgress(task);
  }

  /**
   * Gets the count of completed subtasks for a given task.
   * 
   * @param task - The task to count completed subtasks for
   * @returns Number of completed subtasks
   */
  getCompletedSubtasks(task: Task): number {
    return this.displayService.getCompletedSubtasks(task);
  }

  /**
   * Gets the appropriate icon path for a task's priority level.
   * 
   * @param priority - The priority level of the task
   * @returns Path to the priority icon
   */
  getPriorityIcon(priority: Task['priority']): string {
    return this.displayService.getPriorityIcon(priority);
  }

  /**
   * Filters tasks based on a search term.
   * 
   * @param tasks - Array of tasks to filter
   * @param searchTerm - Search term to filter by
   * @returns Filtered array of tasks
   */
  getFilteredTasks(tasks: Task[], searchTerm: string): Task[] {
    return this.displayService.getFilteredTasks(tasks, searchTerm);
  }

  /**
   * Checks if there are no search results across all task columns.
   * 
   * @param searchTerm - The search term used
   * @param todoTasks - Array of todo tasks
   * @param inProgressTasks - Array of in-progress tasks
   * @param awaitingFeedbackTasks - Array of awaiting feedback tasks
   * @param doneTasks - Array of completed tasks
   * @returns True if no search results found
   */
  hasNoSearchResults(searchTerm: string, todoTasks: Task[], inProgressTasks: Task[], awaitingFeedbackTasks: Task[], doneTasks: Task[]): boolean {
    return this.displayService.hasNoSearchResults(searchTerm, todoTasks, inProgressTasks, awaitingFeedbackTasks, doneTasks);
  }

  // Mobile Task Move Delegation
  /**
   * Handles mobile task move operation.
   * 
   * @param event - Mouse or touch event
   * @param task - Task to be moved
   */
  onMobileMoveTask(event: MouseEvent | TouchEvent, task: Task): void {
    this.mobileTaskMoveService.onMobileMoveTask(event, task);
  }

  /**
   * Closes the mobile task move overlay.
   */
  closeMobileMoveOverlay(): void {
    this.mobileTaskMoveService.closeMobileMoveOverlay();
  }

  /**
   * Gets the visibility state of the mobile move overlay.
   * 
   * @returns True if overlay should be shown
   */
  get showMobileMoveOverlay(): boolean {
    return this.mobileTaskMoveService.showMobileMoveOverlay;
  }

  /**
   * Gets the position coordinates for the mobile overlay.
   * 
   * @returns Object containing top and right position values
   */
  get overlayPosition(): { top: number; right: number } {
    return this.mobileTaskMoveService.overlayPosition;
  }

  /**
   * Gets the currently selected task for mobile move operation.
   * 
   * @returns Selected task or null if none selected
   */
  get selectedTaskForMove(): Task | null {
    return this.mobileTaskMoveService.selectedTaskForMove;
  }

  /**
   * Gets the current column of a task.
   * 
   * @param task - Task to get column for
   * @param taskColumns - Available task columns
   * @returns Current task column or null
   */
  getCurrentTaskColumn(task: Task, taskColumns: any): TaskColumn | null {
    return this.mobileTaskMoveService.getCurrentTaskColumn(task, taskColumns);
  }

  /**
   * Gets the previous column in the workflow.
   * 
   * @param currentColumn - Current task column
   * @returns Previous column or null if none
   */
  getPreviousColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    return this.mobileTaskMoveService.getPreviousColumn(currentColumn);
  }

  /**
   * Gets the next column in the workflow.
   * 
   * @param currentColumn - Current task column
   * @returns Next column or null if none
   */
  getNextColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    return this.mobileTaskMoveService.getNextColumn(currentColumn);
  }

  /**
   * Gets the display name for a task column.
   * 
   * @param column - Task column to get display name for
   * @returns Human-readable column name
   */
  getColumnDisplayName(column: TaskColumn): string {
    return this.mobileTaskMoveService.getColumnDisplayName(column);
  }

  /**
   * Handles mouse down event on mobile move button.
   * 
   * @param event - Mouse event
   */
  onMobileMoveButtonMouseDown(event: MouseEvent): void {
    this.mobileTaskMoveService.onMobileMoveButtonMouseDown(event);
  }

  /**
   * Handles touch start event on mobile move button.
   * 
   * @param event - Touch event
   * @param task - Task associated with the button
   */
  onMobileMoveButtonTouchStart(event: TouchEvent, task: Task): void {
    this.mobileTaskMoveService.onMobileMoveButtonTouchStart(event, task);
  }

  moveTaskToPreviousColumn(taskColumns: any, moveCallback: (task: Task, fromColumn: TaskColumn | null, toColumn: TaskColumn) => void): void {
    this.mobileTaskMoveService.moveTaskToPreviousColumn(taskColumns, moveCallback);
  }

  moveTaskToNextColumn(taskColumns: any, moveCallback: (task: Task, fromColumn: TaskColumn | null, toColumn: TaskColumn) => void): void {
    this.mobileTaskMoveService.moveTaskToNextColumn(taskColumns, moveCallback);
  }

  // Contact Helper Delegation
  /**
   * Gets the contacts to display in the task card (limited number).
   * 
   * @param assignedContacts - Array of assigned contact IDs
   * @param contacts - Array of all available contacts
   * @returns Array of contacts to display
   */
  getDisplayedContacts(assignedContacts: string[], contacts: Contact[]): Contact[] {
    return this.contactHelperService.getDisplayedContacts(assignedContacts, contacts);
  }

  /**
   * Checks if there are more assigned contacts than displayed.
   * 
   * @param assignedContacts - Array of assigned contact IDs
   * @param contacts - Array of all available contacts
   * @returns True if there are remaining contacts not displayed
   */
  hasRemainingContacts(assignedContacts: string[], contacts: Contact[]): boolean {
    return this.contactHelperService.hasRemainingContacts(assignedContacts, contacts);
  }

  /**
   * Gets the count of remaining contacts not displayed.
   * 
   * @param assignedContacts - Array of assigned contact IDs
   * @param contacts - Array of all available contacts
   * @returns Number of remaining contacts
   */
  getRemainingContactsCount(assignedContacts: string[], contacts: Contact[]): number {
    return this.contactHelperService.getRemainingContactsCount(assignedContacts, contacts);
  }

  /**
   * Generates initials from a contact's name.
   * 
   * @param name - Full name of the contact
   * @returns Initials string (usually 2 characters)
   */
  getInitials(name: string): string {
    return this.contactHelperService.getInitials(name);
  }

  /**
   * Gets the background color for contact initials display.
   * 
   * @param name - Full name of the contact
   * @returns CSS color value for the contact's avatar
   */
  getInitialsColor(name: string): string {
    return this.contactHelperService.getInitialsColor(name);
  }
}

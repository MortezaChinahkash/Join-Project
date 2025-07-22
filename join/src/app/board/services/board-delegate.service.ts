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

  closeAddTaskOverlay(): void {
    this.taskManagementService.closeAddTaskOverlay();
  }

  openTaskDetails(task: Task): void {
    this.taskManagementService.openTaskDetails(task);
  }

  closeTaskDetailsOverlay(): void {
    this.taskManagementService.closeTaskDetailsOverlay();
  }

  editTask(contacts: Contact[]): void {
    this.taskManagementService.editTask(contacts);
  }

  cancelEditTask(): void {
    this.taskManagementService.cancelEditTask();
  }

  async deleteTask(): Promise<void> {
    await this.taskManagementService.deleteTask();
  }

  closeDeleteConfirmation(): void {
    this.taskManagementService.closeDeleteConfirmation();
  }

  async submitTaskForm(initCallback: () => void): Promise<void> {
    console.log('🎯 Board onSubmit called');
    await this.taskManagementService.submitTaskForm(() => {
      console.log('🔄 Reinitializing local arrays');
      initCallback();
    });
    console.log('✅ Board onSubmit completed');
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

  getTaskProgress(task: Task): number {
    return this.displayService.getTaskProgress(task);
  }

  getCompletedSubtasks(task: Task): number {
    return this.displayService.getCompletedSubtasks(task);
  }

  getPriorityIcon(priority: Task['priority']): string {
    return this.displayService.getPriorityIcon(priority);
  }

  getFilteredTasks(tasks: Task[], searchTerm: string): Task[] {
    return this.displayService.getFilteredTasks(tasks, searchTerm);
  }

  hasNoSearchResults(searchTerm: string, todoTasks: Task[], inProgressTasks: Task[], awaitingFeedbackTasks: Task[], doneTasks: Task[]): boolean {
    return this.displayService.hasNoSearchResults(searchTerm, todoTasks, inProgressTasks, awaitingFeedbackTasks, doneTasks);
  }

  // Mobile Task Move Delegation
  onMobileMoveTask(event: MouseEvent | TouchEvent, task: Task): void {
    this.mobileTaskMoveService.onMobileMoveTask(event, task);
  }

  closeMobileMoveOverlay(): void {
    this.mobileTaskMoveService.closeMobileMoveOverlay();
  }

  get showMobileMoveOverlay(): boolean {
    return this.mobileTaskMoveService.showMobileMoveOverlay;
  }

  get overlayPosition(): { top: number; right: number } {
    return this.mobileTaskMoveService.overlayPosition;
  }

  get selectedTaskForMove(): Task | null {
    return this.mobileTaskMoveService.selectedTaskForMove;
  }

  getCurrentTaskColumn(task: Task, taskColumns: any): TaskColumn | null {
    return this.mobileTaskMoveService.getCurrentTaskColumn(task, taskColumns);
  }

  getPreviousColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    return this.mobileTaskMoveService.getPreviousColumn(currentColumn);
  }

  getNextColumn(currentColumn: TaskColumn | null): TaskColumn | null {
    return this.mobileTaskMoveService.getNextColumn(currentColumn);
  }

  getColumnDisplayName(column: TaskColumn): string {
    return this.mobileTaskMoveService.getColumnDisplayName(column);
  }

  onMobileMoveButtonMouseDown(event: MouseEvent): void {
    this.mobileTaskMoveService.onMobileMoveButtonMouseDown(event);
  }

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
  getDisplayedContacts(assignedContacts: string[], contacts: Contact[]): Contact[] {
    return this.contactHelperService.getDisplayedContacts(assignedContacts, contacts);
  }

  hasRemainingContacts(assignedContacts: string[], contacts: Contact[]): boolean {
    return this.contactHelperService.hasRemainingContacts(assignedContacts, contacts);
  }

  getRemainingContactsCount(assignedContacts: string[], contacts: Contact[]): number {
    return this.contactHelperService.getRemainingContactsCount(assignedContacts, contacts);
  }

  getInitials(name: string): string {
    return this.contactHelperService.getInitials(name);
  }

  getInitialsColor(name: string): string {
    return this.contactHelperService.getInitialsColor(name);
  }
}

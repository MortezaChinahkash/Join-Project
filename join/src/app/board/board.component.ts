import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Contact, ContactsComponent } from '../contacts/contacts.component';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';
import { BoardDragDropService } from '../services/board-drag-drop.service';
import { BoardThumbnailService } from '../services/board-thumbnail.service';
import { BoardFormService } from '../services/board-form.service';
import { BoardUtilsService } from '../services/board-utils.service';

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
  private firestore = inject(Firestore);
  searchTerm: string = '';

  newSubtaskTitle: string = '';

  // Maximum length for task titles
  maxTitleLength: number = 40;

  editingSubtaskIndex: number | null = null;

  // Arrays für die verschiedenen Spalten - jetzt typisiert
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  awaitingFeedbackTasks: Task[] = [];
  doneTasks: Task[] = [];
  tasks: Task[] = []; // Holds all tasks loaded from Firebase

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

  // Make Math available in template
  Math = Math;

  /**
   * Initializes the board component with services.
   *
   * @param taskService - Service for managing task data operations
   * @param dragDropService - Service for handling drag & drop functionality
   * @param thumbnailService - Service for thumbnail navigation
   * @param formService - Service for form management
   * @param utilsService - Service for utility functions
   */
  constructor(
    private taskService: TaskService,
    public dragDropService: BoardDragDropService,
    public thumbnailService: BoardThumbnailService,
    public formService: BoardFormService,
    public utilsService: BoardUtilsService
  ) {
    // Lokale Arrays initialisieren
    this.updateLocalArrays();
  }

  /**
   * Angular lifecycle hook that runs after component initialization.
   * Loads contacts, fetches tasks from Firebase, and sets up scroll listeners.
   */
  ngOnInit() {
    this.loadContacts();
    this.getTasksFromFirebase();

    // Setup scroll listener after view init
    setTimeout(() => {
      this.thumbnailService.setupScrollListener();
    }, 500);
  }

  /**
   * Loads tasks from Firebase and subscribes to real-time updates.
   * Automatically sorts tasks into appropriate columns based on their status.
   *
   * @returns Promise<void>
   */
  async getTasksFromFirebase() {
    try {
      const taskRef = collection(this.firestore, 'tasks');

      // Subscribe to the collection data
      collectionData(taskRef, { idField: 'id' }).subscribe({
        next: (tasks) => {
          this.tasks = tasks as Task[];

          // NEU: Tasks in die richtigen Spalten sortieren
          this.sortTasksIntoColumns();
        },
        error: (error) => {
          // Error loading tasks
        },
      });
    } catch (error) {
      // Error loading tasks
    }
  }

  /**
   * Gets the initials from a contact name.
   *
   * @param name - The full name of the contact
   * @returns The initials (first letters of first and last name)
   */
  getInitials(name: string): string {
    return ContactsComponent.getInitials(name);
  }

  /**
   * Gets a deterministic color for a contact based on their name.
   *
   * @param name - The full name of the contact
   * @returns A CSS color string for the contact's avatar
   */
  getInitialsColor(name: string): string {
    return ContactsComponent.getInitialsColor(name);
  }

  // Lokale Arrays mit Service synchronisieren und nach Priorität sortieren
  private updateLocalArrays() {
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

  private loadContacts() {
    const contactsCollection = collection(this.firestore, 'contacts');
    collectionData(contactsCollection, { idField: 'id' }).subscribe(
      (contacts) => {
        this.contacts = contacts as Contact[];

        // Alphabetisch sortieren
        this.contacts.sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
      },
      (error) => {
        // Error loading contacts
      }
    );
  }

  private sortTasksIntoColumns() {
    // Arrays zurücksetzen
    this.todoTasks = [];
    this.inProgressTasks = [];
    this.awaitingFeedbackTasks = [];
    this.doneTasks = [];

    // Tasks in die richtigen Spalten sortieren
    this.tasks.forEach((task) => {
      switch (task.column) {
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
        default:
          // Fallback: Wenn keine Spalte definiert, in "todo" einordnen
          console.warn(
            `Task "${task.title}" hat keine gültige Spalte, wird in "todo" eingeordnet`
          );
          this.todoTasks.push(task);
      }
    });

    // Nach der Aufteilung: Jede Spalte nach Priorität sortieren
    this.todoTasks = this.utilsService.sortTasksByPriority(this.todoTasks);
    this.inProgressTasks = this.utilsService.sortTasksByPriority(
      this.inProgressTasks
    );
    this.awaitingFeedbackTasks = this.utilsService.sortTasksByPriority(
      this.awaitingFeedbackTasks
    );
    this.doneTasks = this.utilsService.sortTasksByPriority(this.doneTasks);
  }

  onSearchChange() {
    // Wird automatisch aufgerufen beim Tippen
  }

  // Callback for updating local arrays after task changes
  private updateTaskArrays() {
    // Update local tasks array and sort into columns
    const taskIndex = this.tasks.findIndex(
      (t) => t.id === this.formService.selectedTask?.id
    );
    if (taskIndex !== -1 && this.formService.selectedTask) {
      this.tasks[taskIndex] = this.formService.selectedTask;
    }
    this.sortTasksIntoColumns();
  }

 /**
 * Safely truncate any string (or null/undefined) to a max length,
 * appending “…” if it was longer. 
 */
truncate(text: string | null | undefined, limit: number = 200): string {
  const content = text ?? '';
  if (content.length <= limit) {
    return content;
  }
  return content.slice(0, limit) + '…';
}

  // Delegate methods to services for template access

  // Form Service delegates
  openAddTaskOverlay(column: TaskColumn = 'todo') {
    this.formService.openAddTaskOverlay(column);
  }

  closeAddTaskOverlay() {
    this.formService.closeAddTaskOverlay();
  }

  async onSubmit() {
    await this.formService.onSubmit(() => {
      this.updateLocalArrays();
      this.sortTasksIntoColumns();
    });
  }

  openTaskDetails(task: Task) {
    this.formService.openTaskDetails(task);
  }

  closeTaskDetailsOverlay() {
    this.formService.closeTaskDetailsOverlay();
  }

  editTask() {
    this.formService.editTask(this.contacts);
  }

  cancelEditTask() {
    this.formService.cancelEditTask();
  }

  async saveTaskChanges() {
    await this.formService.saveTaskChanges(() => this.updateTaskArrays());
  }

  async deleteTask() {
    await this.formService.deleteTask(() => {
      this.tasks = this.tasks.filter(
        (t) => t.id !== this.formService.selectedTask!.id
      );
      this.sortTasksIntoColumns();
    });
  }

  async confirmDeleteTask() {
    await this.formService.confirmDeleteTask(() => {
      this.tasks = this.tasks.filter(
        (t) => t.id !== this.formService.taskToDelete!.id
      );
      this.sortTasksIntoColumns();
    });
  }

  closeDeleteConfirmation() {
    this.formService.closeDeleteConfirmation();
  }

  async toggleSubtask(subtaskIndex: number) {
    await this.formService.toggleSubtask(subtaskIndex, () =>
      this.updateTaskArrays()
    );
  }

  // Drag & Drop Service delegates
  async onTaskMouseDown(event: MouseEvent, task: Task) {
    const wasDragged = await this.dragDropService.onTaskMouseDown(
      event,
      task,
      () => {
        this.updateTaskArrays();
      }
    );

    // If it wasn't a drag, treat it as a click to open task details
    if (!wasDragged) {
      setTimeout(() => {
        this.openTaskDetails(task);
      }, 0);
    }
  }

  async onTaskTouchStart(event: TouchEvent, task: Task) {
    const wasDragged = await this.dragDropService.onTaskTouchStart(
      event,
      task,
      () => {
        this.updateTaskArrays();
      }
    );

    // If it wasn't a drag, treat it as a tap to open task details
    if (!wasDragged) {
      setTimeout(() => {
        this.openTaskDetails(task);
      }, 0);
    }
  }

  onColumnDragOver(event: DragEvent, column: TaskColumn) {
    this.dragDropService.onColumnDragOver(event, column);
  }

  onColumnDragLeave(event: DragEvent) {
    this.dragDropService.onColumnDragLeave(event);
  }

  onColumnDrop(event: DragEvent, column: TaskColumn) {
    this.dragDropService.onColumnDrop(event, column);
  }

  // Thumbnail Service delegates
  onThumbnailClick(event: MouseEvent) {
    this.thumbnailService.onThumbnailClick(event);
  }

  onViewportMouseDown(event: MouseEvent) {
    this.thumbnailService.onViewportMouseDown(event);
  }

  onViewportClick(event: MouseEvent) {
    this.thumbnailService.onViewportClick(event);
  }

  // Utils Service delegates (for template access)
  getTaskProgress(task: Task): number {
    return this.utilsService.getTaskProgress(task);
  }

  getCompletedSubtasks(task: Task): number {
    return this.utilsService.getCompletedSubtasks(task);
  }

  getPriorityIcon(priority: Task['priority']): string {
    return this.utilsService.getPriorityIcon(priority);
  }

  getFilteredTasks(tasks: Task[]): Task[] {
    return this.utilsService.getFilteredTasks(tasks, this.searchTerm);
  }

  getDisplayedContacts(assignedTo: string[]): string[] {
    return this.utilsService.getDisplayedContacts(assignedTo);
  }

  getRemainingContactsCount(assignedTo: string[]): number {
    return this.utilsService.getRemainingContactsCount(assignedTo);
  }

  hasRemainingContacts(assignedTo: string[]): boolean {
    return this.utilsService.hasRemainingContacts(assignedTo);
  }

  hasMultipleContacts(assignedTo: string[]): boolean {
    return this.utilsService.hasMultipleContacts(assignedTo);
  }

  getContactCount(assignedTo: string[]): number {
    return this.utilsService.getContactCount(assignedTo);
  }

  getSubtaskProgress(): number {
    return this.utilsService.getSubtaskProgress(this.formService.selectedTask);
  }

  getCompletedSubtasksCount(): number {
    return this.utilsService.getCompletedSubtasksCount(
      this.formService.selectedTask
    );
  }

  get noSearchResults(): boolean {
    return this.utilsService.hasNoSearchResults(
      this.searchTerm,
      this.todoTasks,
      this.inProgressTasks,
      this.awaitingFeedbackTasks,
      this.doneTasks
    );
  }

  // Form Service property access for template
  get displayedAssignedContacts(): string[] {
    return this.formService.getDisplayedAssignedContacts();
  }

  get hasMoreAssignedContacts(): boolean {
    return this.formService.hasMoreAssignedContacts();
  }

  get remainingAssignedContactsCount(): number {
    return this.formService.getRemainingAssignedContactsCount();
  }

  get remainingAssignedContacts(): string[] {
    return this.formService.getRemainingAssignedContacts();
  }

  toggleAssignedContactsDropdown(): void {
    this.formService.toggleAssignedContactsDropdown();
  }

  /**
   * Edit a specific subtask (focus input field)
   * @param index - Index of the subtask to edit
   */
  editSubtask(index: number): void {
     this.editingSubtaskIndex = index;
    setTimeout(() => {
      const inputElement = document.querySelector(
        `.taskEditOverlay [formGroupName="${index}"] input[formControlName="title"]`
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.select(); // Select all text for easy editing
      }
    }, 0);
  }

  newSubtaskText: string = '';

  addNewSubtask(): void {
  const title = this.newSubtaskTitle.trim();
  if (title) {
    this.formService.subtasksFormArray.push(
      this.formService.createSubtaskGroup(title, false)
    );
    this.newSubtaskTitle = '';
  }
}
}

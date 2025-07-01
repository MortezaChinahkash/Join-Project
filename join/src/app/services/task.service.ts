import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { Task, TaskColumn, Subtask } from '../interfaces/task.interface';

/**
 * Service for managing tasks and their operations.
 * Handles CRUD operations both locally and with Firebase integration.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  /** Local storage for tasks organized by columns */
  private tasks: { [key in TaskColumn]: Task[] } = {
    todo: [],
    inprogress: [],
    awaiting: [],
    done: []
  };
  
  /** Firebase collection name for tasks */
  taskCollection: string = "tasks"

  /** Firebase Firestore instance */
  private firestore = inject(Firestore);

  /**
   * Constructor for TaskService.
   */
  constructor() {
  }

  /**
   * Adds a new task to Firebase.
   * @param task - Task data without ID
   * @param column - Target column for the task
   * @returns Promise with the generated Firebase document ID
   */
  async addTaskToFirebase(task: Omit<Task, 'id'>, column: TaskColumn): Promise<string> {
    try {
      const taskData = this.prepareTaskData(task, column);
      const docRef = await addDoc(collection(this.firestore, this.taskCollection), taskData);
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase Fehler:', error);
      throw error;
    }
  }

  /**
   * Prepares task data for Firebase storage.
   * @param task - Task data without ID
   * @param column - Target column for the task
   * @returns Prepared task data with column and timestamp
   */
  private prepareTaskData(task: Omit<Task, 'id'>, column: TaskColumn): any {
    return {
      ...task,
      column: column,
      createdAt: new Date()
    };
  }

  /**
   * Gets tasks for a specific column.
   * @param column - The column to retrieve tasks from
   * @returns Array of tasks in the specified column
   */
  getTasksByColumn(column: TaskColumn): Task[] {
    return this.tasks[column];
  }

  /**
   * Gets all tasks organized by columns.
   * @returns Object containing all tasks grouped by column
   */
  getAllTasks(): { [key in TaskColumn]: Task[] } {
    return this.tasks;
  }

  /**
   * Adds a new task to a specific column locally.
   * @param task - Task data without ID and timestamp
   * @param column - Target column for the task
   * @returns The created task with generated ID
   */
  addTask(task: Omit<Task, 'id' | 'createdAt'>, column: TaskColumn): Task {
    const newTask: Task = this.createNewTask(task);
    this.tasks[column].push(newTask);
    return newTask;
  }

  /**
   * Creates a new task with generated ID and timestamp.
   * @param task - Task data without ID and timestamp
   * @returns Complete task object
   */
  private createNewTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    return {
      ...task,
      id: this.generateId(),
      createdAt: new Date()
    };
  }

  /**
   * Adds a task directly to a column (for Firebase integration).
   * @param task - Complete task object
   * @param column - Target column for the task
   */
  addTaskDirectly(task: Task, column: TaskColumn): void {
    this.tasks[column].push(task);
  }

  /**
   * Generates a temporary ID for local development.
   * @returns Generated string ID
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Updates an existing task with new data.
   * @param taskId - ID of the task to update
   * @param updatedTask - Partial task data for update
   * @returns True if task was found and updated, false otherwise
   */
  updateTask(taskId: string, updatedTask: Partial<Task>): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const success = this.updateTaskInColumn(column, taskId, updatedTask);
      if (success) return true;
    }
    return false;
  }

  /**
   * Updates a task within a specific column.
   * @param column - Column to search in
   * @param taskId - ID of the task to update
   * @param updatedTask - Partial task data for update
   * @returns True if task was found and updated
   */
  private updateTaskInColumn(
    column: TaskColumn, 
    taskId: string, 
    updatedTask: Partial<Task>
  ): boolean {
    const taskIndex = this.tasks[column].findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[column][taskIndex] = { 
        ...this.tasks[column][taskIndex], 
        ...updatedTask 
      };
      return true;
    }
    return false;
  }

  /**
   * Moves a task between columns.
   * @param taskId - ID of the task to move
   * @param fromColumn - Source column
   * @param toColumn - Target column
   * @returns True if task was moved successfully
   */
  moveTask(taskId: string, fromColumn: TaskColumn, toColumn: TaskColumn): boolean {
    const taskIndex = this.tasks[fromColumn].findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const task = this.tasks[fromColumn].splice(taskIndex, 1)[0];
      this.tasks[toColumn].push(task);
      return true;
    }
    return false;
  }

  /**
   * Deletes a task from all columns.
   * @param taskId - ID of the task to delete
   * @returns True if task was found and deleted
   */
  deleteTask(taskId: string): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const success = this.deleteTaskFromColumn(column, taskId);
      if (success) return true;
    }
    return false;
  }

  /**
   * Deletes a task from a specific column.
   * @param column - Column to delete from
   * @param taskId - ID of the task to delete
   * @returns True if task was found and deleted
   */
  private deleteTaskFromColumn(column: TaskColumn, taskId: string): boolean {
    const taskIndex = this.tasks[column].findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[column].splice(taskIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * Adds a subtask to an existing task.
   * @param taskId - ID of the parent task
   * @param subtaskTitle - Title for the new subtask
   * @returns True if task was found and subtask added
   */
  addSubtask(taskId: string, subtaskTitle: string): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const success = this.addSubtaskToColumn(column, taskId, subtaskTitle);
      if (success) return true;
    }
    return false;
  }

  /**
   * Adds a subtask to a task in a specific column.
   * @param column - Column to search in
   * @param taskId - ID of the parent task
   * @param subtaskTitle - Title for the new subtask
   * @returns True if task was found and subtask added
   */
  private addSubtaskToColumn(
    column: TaskColumn, 
    taskId: string, 
    subtaskTitle: string
  ): boolean {
    const task = this.tasks[column].find(task => task.id === taskId);
    if (task) {
      const newSubtask: Subtask = this.createNewSubtask(subtaskTitle);
      task.subtasks.push(newSubtask);
      return true;
    }
    return false;
  }

  /**
   * Creates a new subtask object.
   * @param title - Title for the subtask
   * @returns New subtask object
   */
  private createNewSubtask(title: string): Subtask {
    return {
      id: this.generateId(),
      title: title,
      completed: false
    };
  }

  /**
   * Toggles the completion status of a subtask.
   * @param taskId - ID of the parent task
   * @param subtaskId - ID of the subtask to toggle
   * @returns True if subtask was found and toggled
   */
  toggleSubtask(taskId: string, subtaskId: string): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const success = this.toggleSubtaskInColumn(column, taskId, subtaskId);
      if (success) return true;
    }
    return false;
  }

  /**
   * Toggles a subtask in a specific column.
   * @param column - Column to search in
   * @param taskId - ID of the parent task
   * @param subtaskId - ID of the subtask to toggle
   * @returns True if subtask was found and toggled
   */
  private toggleSubtaskInColumn(
    column: TaskColumn, 
    taskId: string, 
    subtaskId: string
  ): boolean {
    const task = this.tasks[column].find(task => task.id === taskId);
    if (task) {
      const subtask = task.subtasks.find(st => st.id === subtaskId);
      if (subtask) {
        subtask.completed = !subtask.completed;
        return true;
      }
    }
    return false;
  }

  /**
   * Updates a task in Firebase.
   * @param task - Task to update
   * @returns Promise that resolves when update is complete
   */
  async updateTaskInFirebase(task: Task): Promise<void> {
    try {
      this.validateTaskForUpdate(task);
      const taskRef = doc(this.firestore, this.taskCollection, task.id!);
      const { id, ...taskData } = task;
      await updateDoc(taskRef, taskData);
    } catch (error) {
      console.error('❌ Error updating task in Firebase:', error);
      throw error;
    }
  }

  /**
   * Validates task data before Firebase update.
   * @param task - Task to validate
   * @throws Error if task ID is missing
   */
  private validateTaskForUpdate(task: Task): void {
    if (!task.id) {
      throw new Error('Task ID is required for update');
    }
  }

  /**
   * Deletes a task from Firebase.
   * @param taskId - ID of the task to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteTaskFromFirebase(taskId: string): Promise<void> {
    try {
      const taskRef = doc(this.firestore, this.taskCollection, taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('❌ Error deleting task from Firebase:', error);
      throw error;
    }
  }
}

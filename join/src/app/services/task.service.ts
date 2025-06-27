import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { Task, TaskColumn, Subtask } from '../interfaces/task.interface';

@Injectable({
  providedIn: 'root'
})

export class TaskService {
  private tasks: { [key in TaskColumn]: Task[] } = {
    todo: [],
    inprogress: [],
    awaiting: [],
    done: []
  };
  taskCollection: string = "tasks"

  private firestore = inject(Firestore);

  constructor() {
  }

  async addTaskToFirebase(task: Omit<Task, 'id'>, column: TaskColumn): Promise<string> {
    try {
      console.log('🔥 Sende Task zu Firebase:', task);
      
      const taskData = {
        ...task,
        column: column, // ← NEU: Spalte mit speichern
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(this.firestore, this.taskCollection), taskData);
      
      console.log('✅ Firebase Document erstellt mit ID:', docRef.id);
      console.log('📍 Spalte gespeichert:', column);
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase Fehler:', error);
      throw error;
    }
  }

  // Get tasks for a specific column
  getTasksByColumn(column: TaskColumn): Task[] {
    return this.tasks[column];
  }

  // Get all tasks
  getAllTasks(): { [key in TaskColumn]: Task[] } {
    return this.tasks;
  }

  // Add a new task to a specific column
  addTask(task: Omit<Task, 'id' | 'createdAt'>, column: TaskColumn): Task {
    const newTask: Task = {
      ...task,
      id: this.generateId(), // Temporäre ID-Generierung für lokale Entwicklung
      createdAt: new Date()
    };

    this.tasks[column].push(newTask);
    return newTask;
  }

  // Neue Methode: Task direkt hinzufügen (für Firebase Integration)
  addTaskDirectly(task: Task, column: TaskColumn): void {
    this.tasks[column].push(task);
  }

  // Temporary ID generation for local development (will be replaced by Firebase)
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Update a task
  updateTask(taskId: string, updatedTask: Partial<Task>): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const taskIndex = this.tasks[column].findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        this.tasks[column][taskIndex] = { ...this.tasks[column][taskIndex], ...updatedTask };
        return true;
      }
    }
    return false;
  }

  // Move task between columns
  moveTask(taskId: string, fromColumn: TaskColumn, toColumn: TaskColumn): boolean {
    const taskIndex = this.tasks[fromColumn].findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const task = this.tasks[fromColumn].splice(taskIndex, 1)[0];
      this.tasks[toColumn].push(task);
      return true;
    }
    return false;
  }

  // Delete a task
  deleteTask(taskId: string): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const taskIndex = this.tasks[column].findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        this.tasks[column].splice(taskIndex, 1);
        return true;
      }
    }
    return false;
  }

  // Add subtask to a task
  addSubtask(taskId: string, subtaskTitle: string): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const task = this.tasks[column].find(task => task.id === taskId);
      if (task) {
        const newSubtask: Subtask = {
          id: this.generateId(), // Use string ID for subtasks too
          title: subtaskTitle,
          completed: false
        };
        task.subtasks.push(newSubtask);
        return true;
      }
    }
    return false;
  }

  // Toggle subtask completion
  toggleSubtask(taskId: string, subtaskId: string): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const task = this.tasks[column].find(task => task.id === taskId);
      if (task) {
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
          subtask.completed = !subtask.completed;
          return true;
        }
      }
    }
    return false;
  }
}

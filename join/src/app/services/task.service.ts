import { Injectable } from '@angular/core';
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

  constructor() { }

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
      id: Date.now(),
      createdAt: new Date()
    };

    this.tasks[column].push(newTask);
    return newTask;
  }

  // Update a task
  updateTask(taskId: number, updatedTask: Partial<Task>): boolean {
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
  moveTask(taskId: number, fromColumn: TaskColumn, toColumn: TaskColumn): boolean {
    const taskIndex = this.tasks[fromColumn].findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const task = this.tasks[fromColumn].splice(taskIndex, 1)[0];
      this.tasks[toColumn].push(task);
      return true;
    }
    return false;
  }

  // Delete a task
  deleteTask(taskId: number): boolean {
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
  addSubtask(taskId: number, subtaskTitle: string): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const task = this.tasks[column].find(task => task.id === taskId);
      if (task) {
        const newSubtask: Subtask = {
          id: Date.now(),
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
  toggleSubtask(taskId: number, subtaskId: number): boolean {
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

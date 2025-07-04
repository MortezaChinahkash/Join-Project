import { Injectable, inject, runInInjectionContext, Injector } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { Contact } from './contact-data.service';

/**
 * Service for managing board data operations.
 * Handles Firebase data loading and task organization.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDataService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  /**
   * Loads all tasks from Firebase and returns an observable.
   * 
   * @returns Observable stream of tasks from Firebase
   */
  loadTasksFromFirebase(): Observable<Task[]> {
    return runInInjectionContext(this.injector, () => {
      const taskRef = collection(this.firestore, 'tasks');
      return collectionData(taskRef, { idField: 'id' }) as Observable<Task[]>;
    });
  }

  /**
   * Loads all contacts from Firebase and returns an observable.
   * 
   * @returns Observable stream of contacts from Firebase
   */
  loadContactsFromFirebase(): Observable<Contact[]> {
    return runInInjectionContext(this.injector, () => {
      const contactsCollection = collection(this.firestore, 'contacts');
      return collectionData(contactsCollection, { idField: 'id' }) as Observable<Contact[]>;
    });
  }

  /**
   * Sorts contacts alphabetically by name.
   * 
   * @param contacts - Array of contacts to sort
   * @returns Sorted array of contacts
   */
  sortContactsAlphabetically(contacts: Contact[]): Contact[] {
    return contacts.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
  }

  /**
   * Distributes tasks into appropriate column arrays.
   * 
   * @param tasks - All tasks to distribute
   * @returns Object containing tasks organized by column
   */
  distributeTasksToColumns(tasks: Task[]): {
    todoTasks: Task[];
    inProgressTasks: Task[];
    awaitingFeedbackTasks: Task[];
    doneTasks: Task[];
  } {
    const result = {
      todoTasks: [] as Task[],
      inProgressTasks: [] as Task[],
      awaitingFeedbackTasks: [] as Task[],
      doneTasks: [] as Task[]
    };

    this.categorizeTasksByColumn(tasks, result);
    return result;
  }

  /**
   * Categorizes tasks into their respective columns.
   * 
   * @param tasks - Tasks to categorize
   * @param result - Object to store categorized tasks
   */
  private categorizeTasksByColumn(
    tasks: Task[], 
    result: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    }
  ): void {
    tasks.forEach((task) => {
      this.assignTaskToColumn(task, result);
    });
  }

  /**
   * Assigns a single task to its appropriate column.
   * 
   * @param task - Task to assign
   * @param result - Object to store the task in appropriate column
   */
  private assignTaskToColumn(
    task: Task, 
    result: {
      todoTasks: Task[];
      inProgressTasks: Task[];
      awaitingFeedbackTasks: Task[];
      doneTasks: Task[];
    }
  ): void {
    switch (task.column) {
      case 'todo':
        result.todoTasks.push(task);
        break;
      case 'inprogress':
        result.inProgressTasks.push(task);
        break;
      case 'awaiting':
        result.awaitingFeedbackTasks.push(task);
        break;
      case 'done':
        result.doneTasks.push(task);
        break;
      default:
        this.handleUnknownColumn(task, result);
    }
  }

  /**
   * Handles tasks with unknown or undefined columns.
   * 
   * @param task - Task with unknown column
   * @param result - Object to store the task (defaults to todo)
   */
  private handleUnknownColumn(
    task: Task, 
    result: { todoTasks: Task[] }
  ): void {
    console.warn(
      `Task "${task.title}" hat keine gültige Spalte, wird in "todo" eingeordnet`
    );
    result.todoTasks.push(task);
  }
}

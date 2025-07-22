import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Task } from '../../interfaces/task.interface';
import { Observable, Subscription } from 'rxjs';
import { BoardDataService } from '../../board/services/board-data.service';

/**
 * Service for handling summary statistics and task-related operations.
 * Manages task counting, filtering, navigation, and date parsing functionality.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class SummaryStatisticsService {
  private tasks: Task[] = [];
  private tasksSubscription?: Subscription;

  constructor(
    private router: Router,
    private boardDataService: BoardDataService
  ) {}

  /**
   * Loads all tasks for the current user.
   */
  loadAllTasks(): Observable<Task[]> {
    return this.boardDataService.loadTasksFromFirebase();
  }

  /**
   * Sets the current tasks array.
   * @param tasks - Array of tasks to set
   */
  setTasks(tasks: Task[]): void {
    this.tasks = tasks;
  }

  /**
   * Gets the current tasks array.
   * @returns Current tasks array
   */
  getTasks(): Task[] {
    return this.tasks;
  }

  /**
   * Gets the count of open tasks (todo, in progress, awaiting feedback).
   * @returns Number of open tasks
   */
  getOpenTasksCount(): number {
    return this.tasks.filter(task => 
      task.column === 'todo' || 
      task.column === 'inprogress' || 
      task.column === 'awaiting'
    ).length;
  }

  /**
   * Gets the count of tasks in progress.
   * @returns Number of in progress tasks
   */
  getInProgressTasksCount(): number {
    return this.tasks.filter(task => task.column === 'inprogress').length;
  }

  /**
   * Gets the count of tasks awaiting feedback.
   * @returns Number of awaiting tasks
   */
  getAwaitingTasksCount(): number {
    return this.tasks.filter(task => task.column === 'awaiting').length;
  }

  /**
   * Gets the count of todo tasks.
   * @returns Number of todo tasks
   */
  getToDoTasksCount(): number {
    return this.tasks.filter(task => task.column === 'todo').length;
  }

  /**
   * Gets the count of completed tasks.
   * @returns Number of done tasks
   */
  getDoneTasksCount(): number {
    return this.tasks.filter(task => task.column === 'done').length;
  }

  /**
   * Gets the count of urgent tasks that have their deadline today.
   * @returns Number of urgent tasks due today
   */
  getUrgentTasksDueToday(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.tasks.filter(task => {
      if (task.priority !== 'urgent') return false;
      if (!task.dueDate) return false;
      const taskDueDate = this.parseDueDate(task.dueDate);
      taskDueDate.setHours(0, 0, 0, 0);
      return taskDueDate.getTime() === today.getTime();
    }).length;
  }

  /**
   * Gets the count of all urgent tasks regardless of due date.
   * @returns Number of urgent tasks
   */
  getUrgentTasksCount(): number {
    return this.tasks.filter(task => task.priority === 'urgent').length;
  }

  /**
   * Gets the nearest upcoming deadline for urgent tasks.
   * @returns Date object of the nearest urgent task deadline, or null if no urgent tasks with due dates exist
   */
  getNearestUrgentTaskDeadline(): Date | null {
    const urgentTasksWithDueDate = this.getUrgentTasksWithValidDueDate();
    if (urgentTasksWithDueDate.length === 0) return null;
    const nearestTask = this.findTaskWithNearestDeadline(urgentTasksWithDueDate);
    return this.parseDueDate(nearestTask.dueDate!);
  }

  /**
   * Gets urgent tasks that have a valid due date (today or in the future).
   * @returns Array of urgent tasks with valid due dates
   * @private
   */
  private getUrgentTasksWithValidDueDate(): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.tasks.filter(task => 
      task.priority === 'urgent' && 
      task.dueDate && 
      this.parseDueDate(task.dueDate) >= today
    );
  }

  /**
   * Handles findTaskWithNearestDeadline functionality.
   * @param urgentTasks - Urgent tasks parameter
   */
  private findTaskWithNearestDeadline(urgentTasks: Task[]): Task {
    return urgentTasks.reduce((nearest, current) => {
      const currentDate = this.parseDueDate(current.dueDate!);
      const nearestDate = this.parseDueDate(nearest.dueDate!);
      return currentDate < nearestDate ? current : nearest;
    });
  }

  /**
   * Parses a due date string in German format (DD.MM.YYYY) or standard format to a Date object.
   * @param dateString - Date string to parse
   * @returns Parsed Date object or current date if parsing fails
   */
  parseDueDate(dateString: string): Date {
    if (!dateString) return new Date();
    
    if (dateString.includes('.')) {
      const parts = dateString.split('.');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(part => parseInt(part, 10));
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const date = new Date(year, month - 1, day);
          if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            return date;
          }
        }
      }
    } else {
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  /**
   * Gets the formatted month name for the nearest urgent task deadline.
   * @returns Month name string or current month as fallback
   */
  getUrgentDeadlineMonth(): string {
    const deadline = this.getNearestUrgentTaskDeadline();
    if (!deadline) {
      return this.getCurrentMonth();
    }
    const options: Intl.DateTimeFormatOptions = { month: 'long' };
    return deadline.toLocaleDateString('en-US', options);
  }

  /**
   * Gets the day number for the nearest urgent task deadline.
   * @returns Day number or current day as fallback
   */
  getUrgentDeadlineDay(): number {
    const deadline = this.getNearestUrgentTaskDeadline();
    if (!deadline) {
      return this.getCurrentDay();
    }
    return deadline.getDate();
  }

  /**
   * Gets the year for the nearest urgent task deadline.
   * @returns Year number or current year as fallback
   */
  getUrgentDeadlineYear(): number {
    const deadline = this.getNearestUrgentTaskDeadline();
    if (!deadline) {
      return this.getCurrentYear();
    }
    return deadline.getFullYear();
  }

  /**
   * Gets the appropriate deadline text based on whether urgent tasks with deadlines exist.
   * @returns Deadline description text
   */
  getDeadlineText(): string {
    const deadline = this.getNearestUrgentTaskDeadline();
    return deadline ? 'Upcoming Deadline' : 'No Urgent Deadlines';
  }

  /**
   * Gets the current date formatted for display.
   * @returns Formatted date string
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }

  /**
   * Gets the current year.
   * @returns Current year as number
   */
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Gets the current month name.
   * @returns Current month name as string
   */
  getCurrentMonth(): string {
    const options: Intl.DateTimeFormatOptions = { month: 'long' };
    return new Date().toLocaleDateString('en-US', options);
  }

  /**
   * Gets the current day of the month.
   * @returns Current day as number
   */
  getCurrentDay(): number {
    return new Date().getDate();
  }

  /**
   * Gets a time-appropriate greeting based on the current hour.
   * @returns English greeting string
   */
  getTimeBasedGreeting(): string {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      return 'Good morning';
    } else if (currentHour >= 12 && currentHour < 18) {
      return 'Good afternoon';
    } else if (currentHour >= 18 && currentHour < 22) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  }

  /**
   * Navigates to the board component.
   */
  navigateToBoard(): void {
    this.router.navigate(['/board']);
  }

  /**
   * Navigates to the board component filtered by todo tasks.
   */
  navigateToTodoTasks(): void {
    this.router.navigate(['/board'], { 
      queryParams: { filter: 'todo' },
      fragment: 'todo-column'
    });
  }

  /**
   * Navigates to the board component filtered by done tasks and scrolls to done section.
   */
  navigateToDoneTasks(): void {
    this.router.navigate(['/board'], { 
      queryParams: { filter: 'done' },
      fragment: 'done-column'
    });
  }

  /**
   * Navigates to the board component filtered by tasks in board.
   */
  navigateToTasksInBoard(): void {
    this.router.navigate(['/board'], { 
      queryParams: { filter: 'todo' },
      fragment: 'todo-column'
    });
  }

  /**
   * Navigates to the board component filtered by tasks in progress.
   */
  navigateToTasksInProgress(): void {
    this.router.navigate(['/board'], { 
      queryParams: { filter: 'inprogress' },
      fragment: 'inprogress-column'
    });
  }

  /**
   * Navigates to the board component filtered by awaiting feedback tasks.
   */
  navigateToAwaitingTasks(): void {
    this.router.navigate(['/board'], { 
      queryParams: { filter: 'awaiting' },
      fragment: 'awaiting-column'
    });
  }

  /**
   * Navigates to the board and opens the task details for the nearest urgent task.
   * Falls back to general board navigation if no urgent task with deadline exists.
   */
  navigateToNearestUrgentTask(): void {
    const urgentTasksWithDueDate = this.filterUrgentTasksForNavigation();
    
    if (urgentTasksWithDueDate.length === 0) {
      this.router.navigate(['/board']);
      return;
    }
    
    const nearestUrgentTask = this.selectNearestUrgentTask(urgentTasksWithDueDate);
    this.navigateToBoardWithTask(nearestUrgentTask);
  }

  /**
   * Filters urgent tasks that have a due date today or in the future for navigation.
   * @returns Array of urgent tasks with valid due dates
   * @private
   */
  private filterUrgentTasksForNavigation(): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.tasks.filter(task => 
      task.priority === 'urgent' && 
      task.dueDate && 
      this.parseDueDate(task.dueDate) >= today
    );
  }

  /**
   * Selects the urgent task with the nearest due date from the provided list.
   * @param urgentTasks - Array of urgent tasks to search through
   * @returns The task with the nearest due date
   * @private
   */
  private selectNearestUrgentTask(urgentTasks: Task[]): Task {
    return urgentTasks.reduce((nearest, current) => {
      const currentDate = this.parseDueDate(current.dueDate!);
      const nearestDate = this.parseDueDate(nearest.dueDate!);
      return currentDate < nearestDate ? current : nearest;
    });
  }

  /**
   * Navigates to the board with the specified task selected and urgent filter applied.
   * @param task - The task to select in the board
   * @private
   */
  private navigateToBoardWithTask(task: Task): void {
    this.router.navigate(['/board'], { 
      queryParams: { 
        selectedTask: task.id,
        filter: 'urgent'
      }
    });
  }

  /**
   * Cleanup method to unsubscribe from observables.
   */
  cleanup(): void {
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }
  }
}

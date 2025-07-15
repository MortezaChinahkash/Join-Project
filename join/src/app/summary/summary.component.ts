import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { TaskService } from '../services/task.service';
import { BoardDataService } from '../services/board-data.service';
import { Task } from '../interfaces/task.interface';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

/**
 * Component that displays a summary/dashboard view with task statistics and overview.
 * Provides quick access to task metrics and navigation to different sections.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-summary',
  imports: [RouterModule, CommonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private userSubscription?: Subscription;
  private tasksSubscription?: Subscription;
  private tasks: Task[] = [];
  visible = true;

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private boardDataService: BoardDataService,
    private router: Router
  ) {}

  /**
   * Angular lifecycle hook for component initialization.
   */
  ngOnInit(): void {
    this.initializeSummaryData();
    this.subscribeToUser();
    this.loadAllTasks();
    setTimeout(() => this.visible = false, 3000);
  }

  /**
   * Angular lifecycle hook for component cleanup.
   */
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }
  }

  /**
   * Subscribes to the current user observable.
   */
  private subscribeToUser(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Initializes summary data and statistics.
   */
  private initializeSummaryData(): void {
    this.loadTaskStatistics();
    this.setupWelcomeMessage();
  }

  /**
   * Loads task statistics for display.
   */
  private loadTaskStatistics(): void {
    // Implementation for loading task statistics
  }

  /**
   * Sets up the welcome message for the user.
   */
  private setupWelcomeMessage(): void {
    // Implementation for welcome message setup
  }

  /**
   * Gets the current date formatted for display.
   * @returns Formatted date string
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString();
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

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getCurrentMonth(): string {
    const options: Intl.DateTimeFormatOptions = { month: 'long' };
    return new Date().toLocaleDateString('en-US', options);
  };

  getCurrentDay(): number {
    return new Date().getDate();
  }

  /**
   * Gets the display name for the current user.
   * Returns 'Guest' for guest users, otherwise the user's name or 'User' as fallback.
   * @returns Display name string
   */
  getUserDisplayName(): string {
    if (!this.currentUser) {
      return 'Guest';
    }
    
    if (this.currentUser.isGuest) {
      return 'Guest';
    }
    
    return this.currentUser.name || 'User';
  }

  /**
   * Handles navigation to a specific section.
   * @param section - Section to navigate to
   */
  navigateToSection(section: string): void {
    // Implementation for section navigation
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
   * Loads all tasks for the current user.
   */
  private loadAllTasks(): void {
    this.tasksSubscription = this.boardDataService.loadTasksFromFirebase().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
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

  getInProgressTasksCount(): number {
    return this.tasks.filter(task =>        
      task.column === 'inprogress'
      
    ).length;
  }

   getAwaitingTasksCount(): number {
    return this.tasks.filter(task =>        
      task.column === 'awaiting'
      
    ).length;
  }

  getToDoTasksCount(): number {
    return this.tasks.filter(task =>        
      task.column === 'todo'
      
    ).length;
  }

  getDoneTasksCount(): number {
    return this.tasks.filter(task =>        
      task.column === 'done'
      
    ).length;
  }

  /**
   * Gets the count of urgent tasks that have their deadline today.
   * @returns Number of urgent tasks due today
   */
  getUrgentTasksDueToday(): number {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    return this.tasks.filter(task => {
      // Check if task is urgent
      if (task.priority !== 'urgent') {
        return false;
      }
      
      // Check if due date is today
      if (!task.dueDate) {
        return false;
      }
      
      // Convert task due date to comparable format
      const taskDueDate = new Date(task.dueDate);
      const taskDueDateString = taskDueDate.toISOString().split('T')[0];
      
      return taskDueDateString === todayString;
    }).length;
  }

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../shared/services/auth.service';
import { WelcomeOverlayService } from '../shared/services/welcome-overlay.service';
import { SummaryStatisticsService } from './services/summary-statistics.service';
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
  visible = false;

  /**
   * Constructor initializes summary component with auth, welcome overlay and statistics services
   */
  constructor(
    private authService: AuthService,
    private welcomeOverlayService: WelcomeOverlayService,
    private summaryStatisticsService: SummaryStatisticsService
  ) {}
  /**
   * Angular lifecycle hook for component initialization.
   * Sets up subscriptions, loads data, and shows welcome overlay if needed.
   */
  ngOnInit(): void {
    this.initializeSummaryData();
    this.subscribeToUser();
    this.loadAllTasks();
    this.checkAndShowWelcomeOverlay();
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
    this.summaryStatisticsService.cleanup();
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
  }

  /**
   * Loads task statistics for display.
   */
  private loadTaskStatistics(): void {
  }

  /**
   * Checks if the welcome overlay should be shown.
   * Only shows if user came from login screen and is on mobile.
   */
  private checkAndShowWelcomeOverlay(): void {
    if (!this.welcomeOverlayService.shouldShow()) return;
    const isMobile = window.innerWidth <= 1000;
    if (!isMobile) return;
    this.visible = true;
    setTimeout(() => {
      this.visible = false;
    }, 1500);
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
  }

  /**
   * Loads all tasks for the current user.
   */
  private loadAllTasks(): void {
    this.tasksSubscription = this.summaryStatisticsService.loadAllTasks().subscribe({
      next: (tasks) => {
        this.summaryStatisticsService.setTasks(tasks);
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  /**
   * Gets a greeting message based on the current time of day.
   * 
   * @returns Time-based greeting string
   */
  getTimeBasedGreeting(): string {
    return this.summaryStatisticsService.getTimeBasedGreeting();
  }

  /**
   * Gets the current date formatted as a string.
   * 
   * @returns Formatted current date
   */
  getCurrentDate(): string {
    return this.summaryStatisticsService.getCurrentDate();
  }

  /**
   * Gets the current year.
   * 
   * @returns Current year as number
   */
  getCurrentYear(): number {
    return this.summaryStatisticsService.getCurrentYear();
  }

  /**
   * Gets the current month name.
   * 
   * @returns Current month as string
   */
  getCurrentMonth(): string {
    return this.summaryStatisticsService.getCurrentMonth();
  }

  /**
   * Gets the current day of the month.
   * 
   * @returns Current day as number
   */
  getCurrentDay(): number {
    return this.summaryStatisticsService.getCurrentDay();
  }

  /**
   * Navigates to the main board view.
   */
  navigateToBoard(): void {
    this.summaryStatisticsService.navigateToBoard();
  }

  /**
   * Navigates to the board filtered to show only todo tasks.
   */
  navigateToTodoTasks(): void {
    this.summaryStatisticsService.navigateToTodoTasks();
  }

  /**
   * Navigates to the board filtered to show only completed tasks.
   */
  navigateToDoneTasks(): void {
    this.summaryStatisticsService.navigateToDoneTasks();
  }

  /**
   * Navigates to the board to show all tasks.
   */
  navigateToTasksInBoard(): void {
    this.summaryStatisticsService.navigateToTasksInBoard();
  }

  /**
   * Navigates to the board filtered to show only in-progress tasks.
   */
  navigateToTasksInProgress(): void {
    this.summaryStatisticsService.navigateToTasksInProgress();
  }

  /**
   * Navigates to the board filtered to show only awaiting feedback tasks.
   */
  navigateToAwaitingTasks(): void {
    this.summaryStatisticsService.navigateToAwaitingTasks();
  }

  /**
   * Gets the total count of open (non-completed) tasks.
   * 
   * @returns Number of open tasks
   */
  getOpenTasksCount(): number {
    return this.summaryStatisticsService.getOpenTasksCount();
  }

  /**
   * Gets the count of tasks currently in progress.
   * 
   * @returns Number of in-progress tasks
   */
  getInProgressTasksCount(): number {
    return this.summaryStatisticsService.getInProgressTasksCount();
  }

  /**
   * Gets the count of tasks awaiting feedback.
   * 
   * @returns Number of awaiting feedback tasks
   */
  getAwaitingTasksCount(): number {
    return this.summaryStatisticsService.getAwaitingTasksCount();
  }

  /**
   * Gets the count of todo tasks.
   * 
   * @returns Number of todo tasks
   */
  getToDoTasksCount(): number {
    return this.summaryStatisticsService.getToDoTasksCount();
  }

  /**
   * Gets the count of completed tasks.
   * 
   * @returns Number of done tasks
   */
  getDoneTasksCount(): number {
    return this.summaryStatisticsService.getDoneTasksCount();
  }

  /**
   * Gets the count of urgent tasks due today.
   * 
   * @returns Number of urgent tasks due today
   */
  getUrgentTasksDueToday(): number {
    return this.summaryStatisticsService.getUrgentTasksDueToday();
  }

  /**
   * Gets the total count of urgent priority tasks.
   * 
   * @returns Number of urgent tasks
   */
  getUrgentTasksCount(): number {
    return this.summaryStatisticsService.getUrgentTasksCount();
  }

  /**
   * Gets the deadline of the nearest urgent task.
   * 
   * @returns Date of nearest urgent deadline or null if none
   */
  getNearestUrgentTaskDeadline(): Date | null {
    return this.summaryStatisticsService.getNearestUrgentTaskDeadline();
  }

  /**
   * Gets the month name of the nearest urgent task deadline.
   * 
   * @returns Month name string
   */
  getUrgentDeadlineMonth(): string {
    return this.summaryStatisticsService.getUrgentDeadlineMonth();
  }

  /**
   * Gets the day of the nearest urgent task deadline.
   * 
   * @returns Day as number
   */
  getUrgentDeadlineDay(): number {
    return this.summaryStatisticsService.getUrgentDeadlineDay();
  }

  /**
   * Gets the year of the nearest urgent task deadline.
   * 
   * @returns Year as number
   */
  getUrgentDeadlineYear(): number {
    return this.summaryStatisticsService.getUrgentDeadlineYear();
  }

  /**
   * Gets formatted deadline text for display.
   * 
   * @returns Formatted deadline text
   */
  getDeadlineText(): string {
    return this.summaryStatisticsService.getDeadlineText();
  }

  /**
   * Navigates to the board and highlights the nearest urgent task.
   */
  navigateToNearestUrgentTask(): void {
    this.summaryStatisticsService.navigateToNearestUrgentTask();
  }
}

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

  getTimeBasedGreeting(): string {
    return this.summaryStatisticsService.getTimeBasedGreeting();
  }

  getCurrentDate(): string {
    return this.summaryStatisticsService.getCurrentDate();
  }

  getCurrentYear(): number {
    return this.summaryStatisticsService.getCurrentYear();
  }

  getCurrentMonth(): string {
    return this.summaryStatisticsService.getCurrentMonth();
  }

  getCurrentDay(): number {
    return this.summaryStatisticsService.getCurrentDay();
  }

  navigateToBoard(): void {
    this.summaryStatisticsService.navigateToBoard();
  }

  navigateToTodoTasks(): void {
    this.summaryStatisticsService.navigateToTodoTasks();
  }

  navigateToDoneTasks(): void {
    this.summaryStatisticsService.navigateToDoneTasks();
  }

  navigateToTasksInBoard(): void {
    this.summaryStatisticsService.navigateToTasksInBoard();
  }

  navigateToTasksInProgress(): void {
    this.summaryStatisticsService.navigateToTasksInProgress();
  }

  navigateToAwaitingTasks(): void {
    this.summaryStatisticsService.navigateToAwaitingTasks();
  }

  getOpenTasksCount(): number {
    return this.summaryStatisticsService.getOpenTasksCount();
  }

  getInProgressTasksCount(): number {
    return this.summaryStatisticsService.getInProgressTasksCount();
  }

  getAwaitingTasksCount(): number {
    return this.summaryStatisticsService.getAwaitingTasksCount();
  }

  getToDoTasksCount(): number {
    return this.summaryStatisticsService.getToDoTasksCount();
  }

  getDoneTasksCount(): number {
    return this.summaryStatisticsService.getDoneTasksCount();
  }

  getUrgentTasksDueToday(): number {
    return this.summaryStatisticsService.getUrgentTasksDueToday();
  }

  getUrgentTasksCount(): number {
    return this.summaryStatisticsService.getUrgentTasksCount();
  }

  getNearestUrgentTaskDeadline(): Date | null {
    return this.summaryStatisticsService.getNearestUrgentTaskDeadline();
  }

  getUrgentDeadlineMonth(): string {
    return this.summaryStatisticsService.getUrgentDeadlineMonth();
  }

  getUrgentDeadlineDay(): number {
    return this.summaryStatisticsService.getUrgentDeadlineDay();
  }

  getUrgentDeadlineYear(): number {
    return this.summaryStatisticsService.getUrgentDeadlineYear();
  }

  getDeadlineText(): string {
    return this.summaryStatisticsService.getDeadlineText();
  }

  navigateToNearestUrgentTask(): void {
    this.summaryStatisticsService.navigateToNearestUrgentTask();
  }
}

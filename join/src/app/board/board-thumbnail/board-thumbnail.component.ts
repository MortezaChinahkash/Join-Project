import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { BoardThumbnailService } from '../../services/board-thumbnail.service';

/**
 * Board thumbnail component that displays a scrollable overview of the kanban board.
 * Provides navigation functionality and visual representation of task distribution across columns.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-board-thumbnail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-thumbnail.component.html',
  styleUrl: './board-thumbnail.component.scss'
})
export class BoardThumbnailComponent implements OnInit, OnDestroy {
  /**
   * Board columns configuration passed from parent component
   */
  @Input() boardColumns: {
    id: TaskColumn;
    title: string;
    tasks: () => Task[];
    showAddButton: boolean;
    emptyMessage: string;
  }[] = [];

  /**
   * Constructor for BoardThumbnailComponent
   * @param thumbnailService - Service for handling thumbnail functionality
   */
  constructor(public thumbnailService: BoardThumbnailService) {}

  /**
   * Angular lifecycle hook that runs after component initialization.
   */
  ngOnInit(): void {
    this.setupScrollListener();
  }

  /**
   * Angular lifecycle hook that runs before component destruction.
   */
  ngOnDestroy(): void {
    this.thumbnailService.resetThumbnailState();
  }

  /**
   * Sets up the scroll listener for thumbnail navigation.
   */
  private setupScrollListener(): void {
    setTimeout(() => {
      this.thumbnailService.setupScrollListener();
    }, 500);
  }

  /**
   * Handles thumbnail click events.
   * @param event - Mouse event
   */
  onThumbnailClick(event: MouseEvent): void {
    this.thumbnailService.onThumbnailClick(event);
  }

  /**
   * Handles thumbnail touch start events for touch devices.
   * @param event - Touch event
   */
  onThumbnailTouchStart(event: TouchEvent): void {
    this.thumbnailService.onThumbnailTouchStart(event);
  }

  /**
   * Handles viewport mouse down events.
   * @param event - Mouse event
   */
  onViewportMouseDown(event: MouseEvent): void {
    this.thumbnailService.onViewportMouseDown(event);
  }

  /**
   * Handles viewport touch start events for touch devices.
   * @param event - Touch event
   */
  onViewportTouchStart(event: TouchEvent): void {
    this.thumbnailService.onViewportTouchStart(event);
  }

  /**
   * Handles viewport click events.
   * @param event - Mouse event
   */
  onViewportClick(event: MouseEvent): void {
    this.thumbnailService.onViewportClick(event);
  }
}

import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardThumbnailService } from './board-thumbnail.service';
/**
 * Service for handling drag & drop functionality in the board component.
 * Manages task dragging, column detection, and visual feedback for both desktop and mobile.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })

export class BoardDragDropService {
  draggedTask: Task | null = null;
  dragStartPosition = { x: 0, y: 0 };
  isDraggingTask = false;
  dragOverColumn: TaskColumn | null = null;
  dragPlaceholderVisible = false;
  dragPlaceholderHeight = 0;
  touchStartTime = 0;
  longPressTimeout: any = null;
  dragOffset = { x: 0, y: 0 };
  dragElement: HTMLElement | null = null;
  isMousePressed = false;
  mouseDownTime = 0;
  dragThreshold = 5;
  dragDelay = 150;
  dragDelayTimeout: any = null;
  initialMousePosition = { x: 0, y: 0 };
  autoScrollZone = 200;
  autoScrollSpeed = 8;
  autoScrollInterval: any = null;
  isAutoScrolling = false;
  currentCursorY = 0;
  constructor(private taskService: TaskService, private boardThumbnailService: BoardThumbnailService) {}

  /**
   * Handles mouse down events on tasks for desktop drag & drop functionality.
   * Initiates task dragging with left mouse button click and sets up mouse event listeners.
   * Now includes delay and distance threshold to prevent interference with click events.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a click
   */
  onTaskMouseDown(event: MouseEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      if (event.button !== 0) { resolve(false); return; }
      this.isMousePressed = true;
      this.mouseDownTime = Date.now();
      this.initialMousePosition = { x: event.clientX, y: event.clientY };
      let hasMoved = false;
      let dragStarted = false;
      this.dragDelayTimeout = setTimeout(() => {
        if (this.isMousePressed && !hasMoved) {
          this.startTaskDrag(event.clientX, event.clientY, task, event.target as HTMLElement);
          dragStarted = true;
        }
      }, this.dragDelay);

      const handleMouseMove = (e: MouseEvent) => {
        if (!this.isMousePressed) return;
        const deltaX = Math.abs(e.clientX - this.initialMousePosition.x);
        const deltaY = Math.abs(e.clientY - this.initialMousePosition.y);
        if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
          hasMoved = true;
          if (!dragStarted && !this.isDraggingTask) {
            if (this.dragDelayTimeout) { clearTimeout(this.dragDelayTimeout); this.dragDelayTimeout = null; }
            this.startTaskDrag(e.clientX, e.clientY, task, event.target as HTMLElement);
            dragStarted = true;
          }
        }
        if (this.isDraggingTask) {
          this.emergencyAutoScroll(e);
          this.updateTaskDrag(e.clientX, e.clientY);
        }
      };

      const handleMouseUp = () => {
        this.isMousePressed = false;
        if (this.dragDelayTimeout) { clearTimeout(this.dragDelayTimeout); this.dragDelayTimeout = null; }
        if (this.isDraggingTask) {
          this.endTaskDrag(onTaskUpdate);
          resolve(true);
        } else {
          resolve(false);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  /**
   * Handles touch start events on tasks for mobile drag & drop functionality.
   * Implements long press detection (500ms) to initiate dragging on touch devices.
   * 
   * @param event - The touch event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a tap
   */
  onTaskTouchStart(event: TouchEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      event.preventDefault();
      this.touchStartTime = Date.now();
      const touch = event.touches[0];
      let dragStarted = false;
      this.longPressTimeout = setTimeout(() => {
        this.startTaskDrag(touch.clientX, touch.clientY, task, event.target as HTMLElement);
        dragStarted = true;
      }, 500);

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (this.isDraggingTask) {
          e.preventDefault();
          this.emergencyAutoScroll(e);
          this.updateTaskDrag(touch.clientX, touch.clientY);
        } else {
          if (this.longPressTimeout) { clearTimeout(this.longPressTimeout); this.longPressTimeout = null; }
        }
      };

      const handleTouchEnd = () => {
        if (this.longPressTimeout) { clearTimeout(this.longPressTimeout); this.longPressTimeout = null; }
        if (this.isDraggingTask) {
          this.endTaskDrag(onTaskUpdate);
          resolve(true);
        } else {
          resolve(false);
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });

      document.addEventListener('touchend', handleTouchEnd);
    });
  }

  /**
   * Initiates the task dragging process by creating a visual clone and setting up drag state.
   * Creates a rotated clone of the task card and calculates the drag offset for smooth positioning.
   * 
   * @param clientX - The X coordinate of the mouse/touch position
   * @param clientY - The Y Coordinate of the mouse/touch position  
   * @param task - The task object being dragged
   * @param element - The HTML element that triggered the drag
   * @private
   */
  private startTaskDrag(clientX: number, clientY: number, task: Task, element: HTMLElement) {
    this.draggedTask = task;
    this.isDraggingTask = true;
    this.dragStartPosition = { x: clientX, y: clientY };
    this.enableDragOverflow();
    const taskCard = element.closest('.task-card') as HTMLElement;
    if (taskCard) {
      this.dragElement = taskCard.cloneNode(true) as HTMLElement;
      this.dragElement.style.position = 'fixed';
      this.dragElement.style.pointerEvents = 'none';
      this.dragElement.style.zIndex = '9999';
      this.dragElement.style.transform = 'rotate(5deg)';
      this.dragElement.style.transition = 'none';
      this.dragElement.style.width = taskCard.offsetWidth + 'px';
      this.dragElement.style.height = taskCard.offsetHeight + 'px';
      this.dragElement.classList.add('task-dragging');
      const rect = taskCard.getBoundingClientRect();
      this.dragOffset = {
        x: rect.width / 2,
        y: rect.height / 2
      };
      this.dragElement.style.left = (clientX - this.dragOffset.x) + 'px';
      this.dragElement.style.top = (clientY - this.dragOffset.y) + 'px';
      this.dragElement.style.maxWidth = 'none';
      this.dragElement.style.maxHeight = 'none';
      this.dragElement.style.margin = '0';
      this.dragElement.style.padding = taskCard.style.padding || '16px';
      document.body.appendChild(this.dragElement);
      taskCard.classList.add('task-dragging-original');
      this.dragPlaceholderHeight = taskCard.offsetHeight;
    }
  }

  /**
   * Updates the position of the dragged task element and determines target column.
   * Uses multiple detection methods: elementsFromPoint, geometric bounds, and event delegation
   * to accurately detect which column the task is being dragged over.
   * Also handles auto-scrolling when dragging near the top or bottom of the viewport.
   * 
   * @param clientX - The current X coordinate of the mouse/touch position
   * @param clientY - The current Y coordinate of the mouse/touch position
   * @private
   */
  private updateTaskDrag(clientX: number, clientY: number) {
    if (!this.isDraggingTask || !this.dragElement) return;
    this.handleAutoScroll(clientY);
    this.simpleAutoScroll(clientY);
    requestAnimationFrame(() => {
      if (this.dragElement) {
        const left = Math.max(0, Math.min(window.innerWidth - this.dragElement.offsetWidth, clientX - this.dragOffset.x));
        const top = Math.max(0, Math.min(window.innerHeight - this.dragElement.offsetHeight, clientY - this.dragOffset.y));
        this.dragElement.style.left = left + 'px';
        this.dragElement.style.top = top + 'px';
        this.dragElement.style.position = 'fixed';
        this.dragElement.style.zIndex = '9999';
        this.dragElement.style.pointerEvents = 'none';
      }
    });

    const elements = document.elementsFromPoint(clientX, clientY);
    let targetColumn: TaskColumn | null = null;
    for (const element of elements) {
      const columnElement = element.closest('.board-column') as HTMLElement;
      if (columnElement) {
        targetColumn = columnElement.getAttribute('data-column') as TaskColumn;
        break;
      }
      const taskListElement = element.closest('.task-list') as HTMLElement;
      if (taskListElement) {
        const parentColumn = taskListElement.closest('.board-column') as HTMLElement;
        if (parentColumn) {
          targetColumn = parentColumn.getAttribute('data-column') as TaskColumn;
          break;
        }
      }
      const headerElement = element.closest('.column-header') as HTMLElement;
      if (headerElement) {
        const parentColumn = headerElement.closest('.board-column') as HTMLElement;
        if (parentColumn) {
          targetColumn = parentColumn.getAttribute('data-column') as TaskColumn;
          break;
        }
      }
    }
    if (!targetColumn) {
      targetColumn = this.getColumnAtPosition(clientX, clientY);
    }
    if (targetColumn && targetColumn !== this.draggedTask?.column) {
      this.dragOverColumn = targetColumn;
      this.dragPlaceholderVisible = true;
    } else {
      this.dragOverColumn = null;
      this.dragPlaceholderVisible = false;
    }
  }

  /**
   * Enhanced column detection method using geometric bounds as fallback.
   * Iterates through all board columns and checks if the cursor position is within column boundaries.
   * 
   * @param clientX - The X coordinate to check
   * @param clientY - The Y coordinate to check
   * @returns The TaskColumn at the given position, or null if none found
   * @private
   */
  private getColumnAtPosition(clientX: number, clientY: number): TaskColumn | null {
    const columns = document.querySelectorAll('.board-column') as NodeListOf<HTMLElement>;
    for (const column of columns) {
      const rect = column.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return column.getAttribute('data-column') as TaskColumn;
      }
    }
    return null;
  }

  /**
   * Handles auto-scrolling when dragging tasks near the top or bottom of the viewport.
   * Activates when the cursor is within the auto-scroll zone and starts continuous scrolling.
   * Now uses the proper content container instead of the window.
   * 
   * @param clientY - The current Y coordinate of the cursor/touch position
   * @private
   */
  private handleAutoScroll(clientY: number) {
    this.currentCursorY = Math.max(0, Math.min(clientY, window.innerHeight));
    const viewportHeight = window.innerHeight;
    const scrollableContainer = this.findScrollableContainer();
    if (!scrollableContainer) {
      return;
    }
    const containerScrollTop = scrollableContainer.scrollTop;
    const containerScrollHeight = scrollableContainer.scrollHeight;
    const containerClientHeight = scrollableContainer.clientHeight;
    const normalizedY = this.currentCursorY;
    const inTopZone = normalizedY < this.autoScrollZone && containerScrollTop > 0;
    const canScrollDown = (containerScrollTop + containerClientHeight) < containerScrollHeight;
    const inBottomZone = normalizedY > (viewportHeight - this.autoScrollZone) && canScrollDown;
    if (!inTopZone && !inBottomZone) {
      this.stopAutoScroll();
      return;
    }
    if (!this.isAutoScrolling) {
      this.isAutoScrolling = true;
      this.autoScrollInterval = setInterval(() => {
        const currentContainerScrollTop = scrollableContainer.scrollTop;
        const currentContainerScrollHeight = scrollableContainer.scrollHeight;
        const currentContainerClientHeight = scrollableContainer.clientHeight;
        const currentInTopZone = this.currentCursorY < this.autoScrollZone && currentContainerScrollTop > 0;
        const currentCanScrollDown = (currentContainerScrollTop + currentContainerClientHeight) < currentContainerScrollHeight;
        const currentInBottomZone = this.currentCursorY > (window.innerHeight - this.autoScrollZone) && currentCanScrollDown;
        if (currentInTopZone) {
          const distanceFromTop = this.currentCursorY;
          const speed = this.getAdaptiveScrollSpeed(distanceFromTop);
          scrollableContainer.scrollBy(0, -speed);
          this.boardThumbnailService.updateScrollPosition();
        } else if (currentInBottomZone) {

          const distanceFromBottom = window.innerHeight - this.currentCursorY;
          const speed = this.getAdaptiveScrollSpeed(distanceFromBottom);
          scrollableContainer.scrollBy(0, speed);
          this.boardThumbnailService.updateScrollPosition();
        } else {
          this.stopAutoScroll();
        }
      }, 8);
    }
  }

  /**
   * Simple and direct auto-scroll implementation as fallback.
   * This method provides a more straightforward approach using the content container.
   * 
   * @param clientY - The current Y coordinate of the cursor/touch position
   * @private
   */
  private simpleAutoScroll(clientY: number) {
    const scrollZone = 150;
    const scrollSpeed = 10;
    const viewportHeight = window.innerHeight;
    const normalizedY = Math.max(0, Math.min(clientY, viewportHeight));
    const scrollableContainer = this.findScrollableContainer();
    if (!scrollableContainer) {
      return;
    }
    const containerScrollTop = scrollableContainer.scrollTop;
    const containerScrollHeight = scrollableContainer.scrollHeight;
    const containerClientHeight = scrollableContainer.clientHeight;
    if (normalizedY < scrollZone && containerScrollTop > 0) {
      scrollableContainer.scrollBy(0, -scrollSpeed);
      return;
    }
    const canScrollDown = (containerScrollTop + containerClientHeight) < containerScrollHeight;
    if (normalizedY > (viewportHeight - scrollZone) && canScrollDown) {
      scrollableContainer.scrollBy(0, scrollSpeed);
      return;
    }
  }

  /**
   * Calculates adaptive scroll speed based on distance to the edge.
   * The closer to the edge, the faster the scrolling.
   * 
   * @param distance - Distance from the edge (0 = at edge, autoScrollZone = at boundary)
   * @returns The calculated scroll speed
   * @private
   */
  private getAdaptiveScrollSpeed(distance: number): number {
    const proximity = Math.max(0, 1 - (distance / this.autoScrollZone));
    const speed = Math.max(4, this.autoScrollSpeed + (proximity * 20));
    return speed;
  }

  /**
   * Stops the auto-scrolling functionality and clears the interval.
   * 
   * @private
   */
  private stopAutoScroll() {
    if (this.autoScrollInterval) { clearInterval(this.autoScrollInterval); this.autoScrollInterval = null; }
    if (this.isAutoScrolling) { this.isAutoScrolling = false; }
  }

  /**
   * Completes the task dragging process and updates the task in Firebase if moved to a different column.
   * Cleans up the drag element, removes CSS classes, and updates the task's column in the database.
   * Resets all drag-related state variables after completion.
   * 
   * @param onTaskUpdate - Callback to update local task arrays after successful move
   * @private
   */
  private async endTaskDrag(onTaskUpdate: () => void) {
    if (!this.isDraggingTask || !this.draggedTask) return;
    this.stopAutoScroll();
    if (this.dragElement) { document.body.removeChild(this.dragElement); this.dragElement = null; }
    const originalElement = document.querySelector('.task-dragging-original');
    if (originalElement) { originalElement.classList.remove('task-dragging-original'); }
    if (this.dragOverColumn && this.dragOverColumn !== this.draggedTask.column) {
      try {
        const updatedTask: Task = { ...this.draggedTask, column: this.dragOverColumn };
        await this.taskService.updateTaskInFirebase(updatedTask);
        onTaskUpdate();
      } catch (error) {

        console.error('âŒ Error moving task:', error);
      }
    }
    this.isDraggingTask = false;
    this.draggedTask = null;
    this.dragOverColumn = null;
    this.dragPlaceholderVisible = false;
    this.dragPlaceholderHeight = 0;
    this.disableDragOverflow();
    if (this.longPressTimeout) { clearTimeout(this.longPressTimeout); this.longPressTimeout = null; }
  }

  /**
   * Handles drag over events on board columns to show visual feedback.
   * Prevents default behavior and shows placeholder when dragging over a different column.
   * 
   * @param event - The drag event from the column
   * @param column - The target column being dragged over
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn) {
    if (this.isDraggingTask && this.draggedTask && column !== this.draggedTask.column) {
      event.preventDefault();
      this.dragOverColumn = column;
      this.dragPlaceholderVisible = true;
    }
  }

  /**
   * Handles drag leave events on board columns to hide placeholder.
   * Only hides placeholder when actually leaving the column area (not moving to child elements).
   * 
   * @param event - The drag leave event from the column
   */
  onColumnDragLeave(event: DragEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      this.dragOverColumn = null;
      this.dragPlaceholderVisible = false;
    }
  }

  /**
   * Handles drop events on board columns for proper event handling.
   * Prevents default behavior, actual drop logic is handled in endTaskDrag().
   * 
   * @param event - The drop event from the column
   * @param column - The target column where the task is being dropped
   */
  onColumnDrop(event: DragEvent, column: TaskColumn) {
    event.preventDefault();
  }

  /**
   * Resets all drag & drop state variables.
   * Useful for cleanup when component is destroyed or when resetting the board state.
   */
  resetDragState() {
    this.isDraggingTask = false;
    this.draggedTask = null;
    this.dragOverColumn = null;
    this.dragPlaceholderVisible = false;
    this.dragPlaceholderHeight = 0;
    this.currentCursorY = 0;
    this.disableDragOverflow();
    this.stopAutoScroll();
    if (this.longPressTimeout) { clearTimeout(this.longPressTimeout); this.longPressTimeout = null; }
    if (this.dragDelayTimeout) { clearTimeout(this.dragDelayTimeout); this.dragDelayTimeout = null; }
    if (this.dragElement) { document.body.removeChild(this.dragElement); this.dragElement = null; }
  }

  /**
   * Emergency auto-scroll implementation that works with any cursor position.
   * This scrolls the main content container instead of creating artificial scroll areas.
   * Now supports both vertical and horizontal scrolling.
   * 
   * @param event - The mouse or touch event
   * @private
   */
  private emergencyAutoScroll(event: MouseEvent | TouchEvent) {
    if (!this.isDraggingTask) return;
    const scrollSpeed = 15;
    const scrollZone = 100;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    let clientX: number;
    let clientY: number;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }
    const scrollableContainer = this.findScrollableContainer();
    if (!scrollableContainer) {
      return false;
    }
    const containerRect = scrollableContainer.getBoundingClientRect();
    const containerScrollTop = scrollableContainer.scrollTop;
    const containerScrollLeft = scrollableContainer.scrollLeft;
    const containerScrollHeight = scrollableContainer.scrollHeight;
    const containerScrollWidth = scrollableContainer.scrollWidth;
    const containerClientHeight = scrollableContainer.clientHeight;
    const containerClientWidth = scrollableContainer.clientWidth;
    const maxScrollTop = containerScrollHeight - containerClientHeight;
    const maxScrollLeft = containerScrollWidth - containerClientWidth;
    let scrolled = false;
    if (clientY < scrollZone && containerScrollTop > 0) {
      scrollableContainer.scrollBy(0, -scrollSpeed);
      scrolled = true;
    } else if (clientY > (viewportHeight - scrollZone) && containerScrollTop < maxScrollTop) {

      scrollableContainer.scrollBy(0, scrollSpeed);
      scrolled = true;
    }
    if (clientX < scrollZone && containerScrollLeft > 0) {
      scrollableContainer.scrollBy(-scrollSpeed, 0);
      scrolled = true;
    } else if (clientX > (viewportWidth - scrollZone) && containerScrollLeft < maxScrollLeft) {

      scrollableContainer.scrollBy(scrollSpeed, 0);
      scrolled = true;
    }
    return scrolled;
  }

  /**
   * Finds the main scrollable container in the application.
   * Looks for common scrollable container patterns used in Angular apps.
   * 
   * @returns The scrollable container element or null if none found
   * @private
   */
  private findScrollableContainer(): HTMLElement | null {
    const selectors = [
      '.board-container',
      '.main-content',
      '.content-container', 
      '.scroll-container',
      'main',
      '.board',
      '[data-scroll="true"]',
      '.cdk-virtual-scroll-viewport',
      '.mat-drawer-content',
      '.router-outlet-container'
    ];
    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element && this.isScrollable(element)) {
        return element;
      }
    }
    const allElements = document.querySelectorAll('*') as NodeListOf<HTMLElement>;
    for (const element of allElements) {
      if (this.isScrollable(element) && element.scrollHeight > element.clientHeight) {
        return element;
      }
    }
    return document.documentElement;
  }

  /**
   * Checks if an element is scrollable.
   * 
   * @param element - The element to check
   * @returns True if the element is scrollable
   * @private
   */
  private isScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.overflowY === 'scroll' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflow === 'auto';
  }

  /**
   * Enables overflow-x: visible on the board scroll wrapper during drag operations.
   * This allows tasks to be dragged outside the visible area while still maintaining
   * horizontal scrolling capability when not dragging.
   * 
   * @private
   */
  private enableDragOverflow() {
    const scrollWrapper = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (scrollWrapper) { scrollWrapper.classList.add('dragging'); }
  }

  /**
   * Disables overflow-x: visible on the board scroll wrapper after drag operations.
   * This restores normal horizontal scrolling behavior for the board overview.
   * 
   * @private
   */
  private disableDragOverflow() {
    const scrollWrapper = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (scrollWrapper) { scrollWrapper.classList.remove('dragging'); }
  }
}

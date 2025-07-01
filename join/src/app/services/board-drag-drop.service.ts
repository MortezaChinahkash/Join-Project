import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { TaskService } from './task.service';

/**
 * Service for handling drag & drop functionality in the board component.
 * Manages task dragging, column detection, and visual feedback for both desktop and mobile.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragDropService {
  // Task drag and drop properties
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
  
  // New properties for click detection
  isMousePressed = false;
  mouseDownTime = 0;
  dragThreshold = 5; // pixels to move before considering it a drag
  dragDelay = 150; // milliseconds before drag starts
  dragDelayTimeout: any = null;
  initialMousePosition = { x: 0, y: 0 };

  // Auto-scroll properties
  autoScrollZone = 200; // pixels from top/bottom where auto-scroll activates (larger for mobile)
  autoScrollSpeed = 8; // pixels per scroll step (slower for smoother experience)
  autoScrollInterval: any = null;
  isAutoScrolling = false;
  currentCursorY = 0; // Track current cursor position for auto-scroll

  constructor(private taskService: TaskService) {}

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
      // Prevent default but don't prevent the click event from firing
      // event.preventDefault();
      
      // Only handle left mouse button
      if (event.button !== 0) {
        resolve(false);
        return;
      }
      
      this.isMousePressed = true;
      this.mouseDownTime = Date.now();
      this.initialMousePosition = { x: event.clientX, y: event.clientY };
      
      let hasMoved = false;
      let dragStarted = false;
      
      // Start delay timer for drag
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
          
          // Start drag immediately if threshold is exceeded
          if (!dragStarted && !this.isDraggingTask) {
            if (this.dragDelayTimeout) {
              clearTimeout(this.dragDelayTimeout);
              this.dragDelayTimeout = null;
            }
            this.startTaskDrag(e.clientX, e.clientY, task, event.target as HTMLElement);
            dragStarted = true;
          }
        }
        
        if (this.isDraggingTask) {
          // Try emergency auto-scroll first
          this.emergencyAutoScroll(e);
          this.updateTaskDrag(e.clientX, e.clientY);
        }
      };
      
      const handleMouseUp = () => {
        this.isMousePressed = false;
        
        if (this.dragDelayTimeout) {
          clearTimeout(this.dragDelayTimeout);
          this.dragDelayTimeout = null;
        }
        
        if (this.isDraggingTask) {
          this.endTaskDrag(onTaskUpdate);
          resolve(true); // Was a drag
        } else {
          resolve(false); // Was a click
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
      
      // Start long press timer for mobile
      this.longPressTimeout = setTimeout(() => {
        this.startTaskDrag(touch.clientX, touch.clientY, task, event.target as HTMLElement);
        dragStarted = true;
      }, 500); // 500ms long press
      
      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (this.isDraggingTask) {
          e.preventDefault();
          console.log('Touch move during drag:', touch.clientX, touch.clientY);
          // Try emergency auto-scroll first
          this.emergencyAutoScroll(e);
          this.updateTaskDrag(touch.clientX, touch.clientY);
        } else {
          // Cancel long press if user moves finger before drag starts
          if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
          }
        }
      };
      
      const handleTouchEnd = () => {
        if (this.longPressTimeout) {
          clearTimeout(this.longPressTimeout);
          this.longPressTimeout = null;
        }
        
        if (this.isDraggingTask) {
          this.endTaskDrag(onTaskUpdate);
          resolve(true); // Was a drag
        } else {
          resolve(false); // Was a tap
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
   * @param clientY - The Y coordinate of the mouse/touch position  
   * @param task - The task object being dragged
   * @param element - The HTML element that triggered the drag
   * @private
   */
  private startTaskDrag(clientX: number, clientY: number, task: Task, element: HTMLElement) {
    console.log('Starting task drag at:', clientX, clientY);
    this.draggedTask = task;
    this.isDraggingTask = true;
    this.dragStartPosition = { x: clientX, y: clientY };
    
    // Find the task card element
    const taskCard = element.closest('.task-card') as HTMLElement;
    if (taskCard) {
      // Clone the element for dragging
      this.dragElement = taskCard.cloneNode(true) as HTMLElement;
      this.dragElement.style.position = 'fixed';
      this.dragElement.style.pointerEvents = 'none';
      this.dragElement.style.zIndex = '9999';
      this.dragElement.style.transform = 'rotate(5deg)';
      this.dragElement.style.transition = 'none';
      this.dragElement.style.width = taskCard.offsetWidth + 'px';
      this.dragElement.style.height = taskCard.offsetHeight + 'px';
      this.dragElement.classList.add('task-dragging');
      
      // Calculate offset from mouse/touch to element
      const rect = taskCard.getBoundingClientRect();
      this.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      
      // Position the drag element
      this.dragElement.style.left = (clientX - this.dragOffset.x) + 'px';
      this.dragElement.style.top = (clientY - this.dragOffset.y) + 'px';
      
      document.body.appendChild(this.dragElement);
      
      // Add dragging class to original element
      taskCard.classList.add('task-dragging-original');
      
      // Store placeholder height
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
    
    // Handle auto-scrolling - MUST be called first
    this.handleAutoScroll(clientY);
    
    // Also try simple auto-scroll as immediate fallback
    this.simpleAutoScroll(clientY);
    
    console.log('🎯 Updating task drag:', clientX, clientY);
    
    // Update drag element position
    this.dragElement.style.left = (clientX - this.dragOffset.x) + 'px';
    this.dragElement.style.top = (clientY - this.dragOffset.y) + 'px';
    
    // Primary method: Check which column we're over using elementFromPoint
    const elements = document.elementsFromPoint(clientX, clientY);
    let targetColumn: TaskColumn | null = null;
    
    for (const element of elements) {
      // Check for board-column element (main column container)
      const columnElement = element.closest('.board-column') as HTMLElement;
      if (columnElement) {
        targetColumn = columnElement.getAttribute('data-column') as TaskColumn;
        break;
      }
      
      // Also check for task-list element as fallback
      const taskListElement = element.closest('.task-list') as HTMLElement;
      if (taskListElement) {
        const parentColumn = taskListElement.closest('.board-column') as HTMLElement;
        if (parentColumn) {
          targetColumn = parentColumn.getAttribute('data-column') as TaskColumn;
          break;
        }
      }
      
      // Check for column-header as additional fallback
      const headerElement = element.closest('.column-header') as HTMLElement;
      if (headerElement) {
        const parentColumn = headerElement.closest('.board-column') as HTMLElement;
        if (parentColumn) {
          targetColumn = parentColumn.getAttribute('data-column') as TaskColumn;
          break;
        }
      }
    }
    
    // Fallback method: Use geometric bounds detection if primary method fails
    if (!targetColumn) {
      targetColumn = this.getColumnAtPosition(clientX, clientY);
    }
    
    // Update drag over column and show/hide placeholder
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
    // Get all board columns
    const columns = document.querySelectorAll('.board-column') as NodeListOf<HTMLElement>;
    
    for (const column of columns) {
      const rect = column.getBoundingClientRect();
      
      // Check if the cursor is within the column bounds
      if (clientX >= rect.left && 
          clientX <= rect.right && 
          clientY >= rect.top && 
          clientY <= rect.bottom) {
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
    // Update current cursor position with bounds checking
    this.currentCursorY = Math.max(0, Math.min(clientY, window.innerHeight));
    
    const viewportHeight = window.innerHeight;
    const scrollableContainer = this.findScrollableContainer();
    
    if (!scrollableContainer) {
      console.log('❌ No scrollable container found for auto-scroll');
      return;
    }
    
    const containerScrollTop = scrollableContainer.scrollTop;
    const containerScrollHeight = scrollableContainer.scrollHeight;
    const containerClientHeight = scrollableContainer.clientHeight;
    
    // Use normalized cursor position for zone detection
    const normalizedY = this.currentCursorY;
    
    // Check if we're in the top auto-scroll zone
    const inTopZone = normalizedY < this.autoScrollZone && containerScrollTop > 0;
    // Check if we're in the bottom auto-scroll zone  
    const canScrollDown = (containerScrollTop + containerClientHeight) < containerScrollHeight;
    const inBottomZone = normalizedY > (viewportHeight - this.autoScrollZone) && canScrollDown;
    
    console.log('🔄 Auto-scroll check (container):', {
      originalCursorY: clientY,
      normalizedCursorY: normalizedY,
      viewportHeight,
      containerScrollTop,
      containerScrollHeight,
      containerClientHeight,
      autoScrollZone: this.autoScrollZone,
      inTopZone,
      inBottomZone,
      canScrollDown,
      isAutoScrolling: this.isAutoScrolling
    });
    
    // Stop auto-scrolling if we're not in any zone
    if (!inTopZone && !inBottomZone) {
      this.stopAutoScroll();
      return;
    }
    
    // Start auto-scrolling if not already active
    if (!this.isAutoScrolling) {
      console.log('🚀 Starting auto-scroll (container)...');
      this.isAutoScrolling = true;
      
      this.autoScrollInterval = setInterval(() => {
        const currentContainerScrollTop = scrollableContainer.scrollTop;
        const currentContainerScrollHeight = scrollableContainer.scrollHeight;
        const currentContainerClientHeight = scrollableContainer.clientHeight;
        
        // Recalculate zones based on current cursor position
        const currentInTopZone = this.currentCursorY < this.autoScrollZone && currentContainerScrollTop > 0;
        const currentCanScrollDown = (currentContainerScrollTop + currentContainerClientHeight) < currentContainerScrollHeight;
        const currentInBottomZone = this.currentCursorY > (window.innerHeight - this.autoScrollZone) && currentCanScrollDown;
        
        console.log('🔍 Scroll interval check (container):', {
          currentCursorY: this.currentCursorY,
          currentInTopZone,
          currentInBottomZone,
          currentContainerScrollTop,
          currentCanScrollDown,
          maxScroll: currentContainerScrollHeight - currentContainerClientHeight
        });
        
        if (currentInTopZone) {
          // Speed increases as we get closer to the top
          const distanceFromTop = this.currentCursorY;
          const speed = this.getAdaptiveScrollSpeed(distanceFromTop);
          // Scroll up in container
          scrollableContainer.scrollBy(0, -speed);
          console.log('⬆️ Auto-scrolling UP (container), speed:', speed, 'cursorY:', this.currentCursorY);
        } else if (currentInBottomZone) {
          // Speed increases as we get closer to the bottom
          const distanceFromBottom = window.innerHeight - this.currentCursorY;
          const speed = this.getAdaptiveScrollSpeed(distanceFromBottom);
          // Scroll down in container
          scrollableContainer.scrollBy(0, speed);
          console.log('⬇️ Auto-scrolling DOWN (container), speed:', speed, 'cursorY:', this.currentCursorY);
        } else {
          // Stop if we've moved out of the zones or reached limits
          console.log('⏹️ Stopping auto-scroll - out of zone');
          this.stopAutoScroll();
        }
      }, 8); // Even higher frequency for ultra-smooth scrolling
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
    
    // Ensure clientY is within reasonable bounds
    const normalizedY = Math.max(0, Math.min(clientY, viewportHeight));
    
    // Find scrollable container
    const scrollableContainer = this.findScrollableContainer();
    if (!scrollableContainer) {
      console.log('❌ Simple auto-scroll: No container found');
      return;
    }
    
    const containerScrollTop = scrollableContainer.scrollTop;
    const containerScrollHeight = scrollableContainer.scrollHeight;
    const containerClientHeight = scrollableContainer.clientHeight;
    
    console.log('🔧 Simple auto-scroll debug (container):', {
      originalY: clientY,
      normalizedY,
      viewportHeight,
      scrollZone,
      containerScrollTop,
      containerScrollHeight,
      containerClientHeight,
      topZoneCheck: normalizedY < scrollZone,
      bottomZoneCheck: normalizedY > (viewportHeight - scrollZone),
      canScrollUp: containerScrollTop > 0,
      canScrollDown: (containerScrollTop + containerClientHeight) < containerScrollHeight
    });
    
    // Top zone - use normalized Y to prevent negative values
    if (normalizedY < scrollZone && containerScrollTop > 0) {
      scrollableContainer.scrollBy(0, -scrollSpeed);
      console.log('🔝 Simple scroll UP (container) - executed');
      return;
    }
    
    // Bottom zone - check if we can scroll down
    const canScrollDown = (containerScrollTop + containerClientHeight) < containerScrollHeight;
    if (normalizedY > (viewportHeight - scrollZone) && canScrollDown) {
      scrollableContainer.scrollBy(0, scrollSpeed);
      console.log('🔻 Simple scroll DOWN (container) - executed');
      return;
    }
    
    console.log('❌ No scroll action taken');
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
    console.log('📊 Speed calculation:', { distance, proximity, speed });
    return speed;
  }

  /**
   * Stops the auto-scrolling functionality and clears the interval.
   * 
   * @private
   */
  private stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
      console.log('🛑 Auto-scroll interval cleared');
    }
    if (this.isAutoScrolling) {
      this.isAutoScrolling = false;
      console.log('🛑 Auto-scroll stopped');
    }
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
    
    // Stop auto-scrolling
    this.stopAutoScroll();
    
    // Remove drag element
    if (this.dragElement) {
      document.body.removeChild(this.dragElement);
      this.dragElement = null;
    }
    
    // Remove dragging classes
    const originalElement = document.querySelector('.task-dragging-original');
    if (originalElement) {
      originalElement.classList.remove('task-dragging-original');
    }
    
    // If dropped on a different column, move the task
    if (this.dragOverColumn && this.dragOverColumn !== this.draggedTask.column) {
      try {
        const updatedTask: Task = {
          ...this.draggedTask,
          column: this.dragOverColumn
        };
        
        await this.taskService.updateTaskInFirebase(updatedTask);
        
        // Call the update callback to refresh local arrays
        onTaskUpdate();
      } catch (error) {
        console.error('❌ Error moving task:', error);
      }
    }
    
    // Reset drag state
    this.isDraggingTask = false;
    this.draggedTask = null;
    this.dragOverColumn = null;
    this.dragPlaceholderVisible = false;
    this.dragPlaceholderHeight = 0;
    
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
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
    // Only hide placeholder if we're actually leaving the column area
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
    // The actual drop logic is handled in endTaskDrag()
    // This just ensures proper event handling
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
    
    // Stop auto-scrolling
    this.stopAutoScroll();
    
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    
    if (this.dragDelayTimeout) {
      clearTimeout(this.dragDelayTimeout);
      this.dragDelayTimeout = null;
    }
    
    if (this.dragElement) {
      document.body.removeChild(this.dragElement);
      this.dragElement = null;
    }
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
    
    // Find the main scrollable container (likely the board or main content area)
    const scrollableContainer = this.findScrollableContainer();
    
    if (!scrollableContainer) {
      console.log('❌ No scrollable container found');
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
    
    console.log('🚨 Emergency auto-scroll (container):', {
      clientX,
      clientY,
      viewportHeight,
      viewportWidth,
      scrollZone,
      containerScrollTop,
      containerScrollLeft,
      containerScrollHeight,
      containerScrollWidth,
      containerClientHeight,
      containerClientWidth,
      maxScrollTop,
      maxScrollLeft,
      canScrollUp: containerScrollTop > 0,
      canScrollDown: containerScrollTop < maxScrollTop,
      canScrollLeft: containerScrollLeft > 0,
      canScrollRight: containerScrollLeft < maxScrollLeft,
      topZoneActive: clientY < scrollZone,
      bottomZoneActive: clientY > (viewportHeight - scrollZone),
      leftZoneActive: clientX < scrollZone,
      rightZoneActive: clientX > (viewportWidth - scrollZone)
    });
    
    let scrolled = false;
    
    // Vertical scrolling
    if (clientY < scrollZone && containerScrollTop > 0) {
      scrollableContainer.scrollBy(0, -scrollSpeed);
      console.log('🆙 Emergency scroll UP (container) - EXECUTED');
      scrolled = true;
    } else if (clientY > (viewportHeight - scrollZone) && containerScrollTop < maxScrollTop) {
      scrollableContainer.scrollBy(0, scrollSpeed);
      console.log('⬇️ Emergency scroll DOWN (container) - EXECUTED');
      scrolled = true;
    }
    
    // Horizontal scrolling
    if (clientX < scrollZone && containerScrollLeft > 0) {
      scrollableContainer.scrollBy(-scrollSpeed, 0);
      console.log('⬅️ Emergency scroll LEFT (container) - EXECUTED');
      scrolled = true;
    } else if (clientX > (viewportWidth - scrollZone) && containerScrollLeft < maxScrollLeft) {
      scrollableContainer.scrollBy(scrollSpeed, 0);
      console.log('➡️ Emergency scroll RIGHT (container) - EXECUTED');
      scrolled = true;
    }
    
    if (!scrolled) {
      console.log('❌ Emergency scroll: No action - not in zone or cannot scroll');
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
    // Common selectors for scrollable containers in Angular apps
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
        console.log('✅ Found scrollable container:', selector);
        return element;
      }
    }
    
    // Fallback: Find any element with overflow scroll/auto
    const allElements = document.querySelectorAll('*') as NodeListOf<HTMLElement>;
    for (const element of allElements) {
      if (this.isScrollable(element) && element.scrollHeight > element.clientHeight) {
        console.log('✅ Found scrollable element via fallback:', element.tagName.toLowerCase() + (element.className ? '.' + element.className.split(' ').join('.') : ''));
        return element;
      }
    }
    
    console.log('❌ No scrollable container found, using document.documentElement');
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
}

import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardThumbnailService } from './board-thumbnail.service';
import { BoardDragStateService } from './board-drag-state.service';
import { BoardAutoScrollService } from './board-auto-scroll.service';
import { BoardTouchHandlerService } from './board-touch-handler.service';
/**
 * Main service for handling drag & drop functionality in the board component.
 * Orchestrates task dragging, column detection, and visual feedback for both desktop and mobile.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 2.0.0 - Refactored into multiple specialized services
 */
@Injectable({ providedIn: 'root' })
export class BoardDragDropService {
  constructor(
    private taskService: TaskService,
    private boardThumbnailService: BoardThumbnailService,
    private dragState: BoardDragStateService,
    private autoScroll: BoardAutoScrollService,
    private touchHandler: BoardTouchHandlerService
  ) {}
  // Expose state properties through getters for backward compatibility
  get draggedTask(): Task | null { return this.dragState.draggedTask; }
  get isDraggingTask(): boolean { return this.dragState.isDraggingTask; }
  get dragOverColumn(): TaskColumn | null { return this.dragState.dragOverColumn; }
  get dragPlaceholderVisible(): boolean { return this.dragState.dragPlaceholderVisible; }
  get dragPlaceholderHeight(): number { return this.dragState.dragPlaceholderHeight; }
  
  /**
   * Emergency cleanup method to restore board scroll wrapper overflow.
   * Can be called from components or external services.
   */
  emergencyCleanup(): void {
    this.dragState.emergencyCleanup();
  }
  /**
   * Handles mouse down events on tasks for desktop drag & drop functionality.
   * Initiates task dragging with left mouse button click and sets up mouse event listeners.
   * Includes delay and distance threshold to prevent interference with click events.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a click
   */
  onTaskMouseDown(event: MouseEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      if (event.button !== 0) { 
        resolve(false); 
        return; 
      }
      this.dragState.setMousePressed(event.clientX, event.clientY);
      let hasMoved = false;
      let dragStarted = false;
      // Start delay timer for drag
      this.dragState.dragDelayTimeout = setTimeout(() => {
        if (this.dragState.isMousePressed && !hasMoved) {
          this.startTaskDrag(event.clientX, event.clientY, task, event.target as HTMLElement);
          dragStarted = true;
        }
      }, this.dragState.dragDelay);
      const handleMouseMove = (e: MouseEvent) => {
        if (!this.dragState.isMousePressed) return;
        if (this.dragState.exceedsDragThreshold(e.clientX, e.clientY)) {
          hasMoved = true;
          // Start drag immediately if threshold is exceeded
          if (!dragStarted && !this.dragState.isDraggingTask) {
            this.dragState.clearTimeouts();
            this.startTaskDrag(e.clientX, e.clientY, task, event.target as HTMLElement);
            dragStarted = true;
          }
        }
        if (this.dragState.isDraggingTask) {
          this.autoScroll.emergencyAutoScroll(e);
          this.updateTaskDrag(e.clientX, e.clientY);
        }
      };
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        this.dragState.isMousePressed = false;
        this.dragState.clearTimeouts();
        if (this.dragState.isDraggingTask) {
          this.finishTaskDrag(onTaskUpdate);
        }
        resolve(dragStarted);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }
  /**
   * Handles touch start events on tasks for mobile drag & drop functionality.
   * Delegates to TouchHandlerService for mobile-specific behavior.
   * 
   * @param event - The touch event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a tap
   */
  onTaskTouchStart(event: TouchEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return this.touchHandler.onTaskTouchStart(event, task, onTaskUpdate);
  }
  /**
   * Starts task drag operation for desktop.
   * 
   * @param clientX - Mouse X position
   * @param clientY - Mouse Y position
   * @param task - Task being dragged
   * @param targetElement - Target element
   */
  private startTaskDrag(clientX: number, clientY: number, task: Task, targetElement: HTMLElement): void {
    this.dragState.startDrag(task, clientX, clientY);
    this.createDragElement(task, targetElement, clientX, clientY);
    const taskElement = targetElement.closest('.task-card') as HTMLElement;
    if (taskElement) {
      taskElement.style.opacity = '0.5';
    }
    this.dragState.setPlaceholder(false, 0);
  }
  /**
   * Updates task drag position with placeholder logic.
   * 
   * @param clientX - Current X position
   * @param clientY - Current Y position
   */
  private updateTaskDragWithPlaceholder(clientX: number, clientY: number): void {
    this.dragState.updateDragPosition(clientX, clientY);
    this.autoScroll.handleAutoScroll(clientX, clientY);
    const column = this.getColumnAtPosition(clientX, clientY);
    this.handleColumnChange(column, clientX, clientY);
    this.dragState.setDragOverColumn(column);
  }
  private handleColumnChange(column: TaskColumn | null, clientX: number, clientY: number): void {
    const previousColumn = this.dragState.dragOverColumn;
    if (column !== previousColumn) {
      this.updatePlaceholderForColumn(column);
    }
  }
  private updatePlaceholderForColumn(column: TaskColumn | null): void {
    if (this.shouldShowPlaceholder(column)) {
      const placeholderHeight = this.calculatePlaceholderHeight();
      this.dragState.setPlaceholder(true, placeholderHeight);
    } else {
      this.dragState.setPlaceholder(false, 0);
    }
  }
  private shouldShowPlaceholder(column: TaskColumn | null): boolean {
    return !!(column && 
             this.dragState.draggedTask && 
             column !== this.dragState.draggedTask.column);
  }
  private calculatePlaceholderHeight(): number {
    const taskElement = document.querySelector('.task-card[style*="opacity: 0.5"]') as HTMLElement;
    return taskElement ? taskElement.offsetHeight : 80;
  }
  /**
   * Updates task drag position.
   * 
   * @param clientX - Current X position
   * @param clientY - Current Y position
   */
  private updateTaskDrag(clientX: number, clientY: number): void {
    this.updateTaskDragWithPlaceholder(clientX, clientY);
  }
  /**
   * Finishes task drag operation.
   * 
   * @param onTaskUpdate - Callback for task updates
   */
  private finishTaskDrag(onTaskUpdate: () => void): void {
    // Remove drag element
    if (this.dragState.dragElement) {
      this.dragState.dragElement.remove();
    }
    // Restore original task visibility
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
      (card as HTMLElement).style.opacity = '';
    });
    // Handle drop logic
    if (this.dragState.dragOverColumn && this.dragState.draggedTask) {
      this.handleTaskDrop(onTaskUpdate);
    }
    // Hide placeholder
    this.dragState.setPlaceholder(false, 0);
    // Cleanup
    this.dragState.resetDragState();
    this.autoScroll.stopAutoScroll();
  }
  /**
   * Creates visual drag element.
   * 
   * @param task - Task being dragged
   * @param originalElement - Original task element
   * @param clientX - X position
   * @param clientY - Y position
   */
  private createDragElement(task: Task, originalElement: HTMLElement, clientX: number, clientY: number): void {
    const taskElement = originalElement.closest('.task-card') as HTMLElement;
    if (!taskElement) return;
    const originalRect = taskElement.getBoundingClientRect();
    const dragElement = this.cloneAndStyleDragElement(taskElement);
    document.body.appendChild(dragElement);
    this.initializeDragElementPosition(dragElement, originalRect, clientX, clientY);
  }
  private cloneAndStyleDragElement(taskElement: HTMLElement): HTMLElement {
    const dragElement = taskElement.cloneNode(true) as HTMLElement;
    this.applyDragElementStyles(dragElement, taskElement);
    return dragElement;
  }
  private applyDragElementStyles(dragElement: HTMLElement, taskElement: HTMLElement): void {
    dragElement.style.position = 'fixed';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.zIndex = '10000';
    dragElement.style.transform = 'rotate(2deg)';
    dragElement.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
    dragElement.style.opacity = '0.95';
    dragElement.style.width = `${taskElement.offsetWidth}px`;
    dragElement.style.height = `${taskElement.offsetHeight}px`;
  }
  private initializeDragElementPosition(dragElement: HTMLElement, originalRect: DOMRect, clientX: number, clientY: number): void {
    const offsetX = clientX - originalRect.left;
    const offsetY = clientY - originalRect.top;
    this.dragState.setDragElementWithOffset(dragElement, offsetX, offsetY);
    this.dragState.updateDragPosition(clientX, clientY);
  }
  /**
   * Determines which column is at the given position.
   * 
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @returns Column at position or null
   */
  private getColumnAtPosition(clientX: number, clientY: number): TaskColumn | null {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const element of elements) {
      if (element.classList.contains('board-column') || element.classList.contains('task-list')) {
        const columnId = element.getAttribute('data-column') || 
                        element.closest('[data-column]')?.getAttribute('data-column');
        switch (columnId) {
          case 'todo': return 'todo';
          case 'inprogress': return 'inprogress';
          case 'awaiting': return 'awaiting';
          case 'done': return 'done';
        }
      }
    }
    return null;
  }
  /**
   * Handles task drop logic.
   * 
   * @param onTaskUpdate - Callback for task updates
   */
  private handleTaskDrop(onTaskUpdate: () => void): void {
    if (!this.validateDropPreconditions()) {
      return;
    }
    const oldColumn = this.dragState.draggedTask!.column;
    const newColumn = this.dragState.dragOverColumn!;
    this.processTaskColumnChange(oldColumn, newColumn, onTaskUpdate);
  }
  private validateDropPreconditions(): boolean {
    return !!(this.dragState.draggedTask && this.dragState.dragOverColumn);
  }
  private processTaskColumnChange(oldColumn: TaskColumn, newColumn: TaskColumn, onTaskUpdate: () => void): void {
    if (oldColumn !== newColumn) {
      this.updateTaskColumn(newColumn);
      this.updateTaskInFirebase(oldColumn);
    }
    onTaskUpdate();
  }
  private updateTaskColumn(newColumn: TaskColumn): void {
    this.dragState.draggedTask!.column = newColumn;
  }
  private updateTaskInFirebase(oldColumn: TaskColumn): void {
    if (this.dragState.draggedTask!.id) {
      this.taskService.updateTaskInFirebase(this.dragState.draggedTask!)
        .then(() => {        })
        .catch((error) => {
          this.handleFirebaseUpdateError(error, oldColumn);
        });
    }
  }
  private handleFirebaseUpdateError(error: any, oldColumn: TaskColumn): void {
    console.error('Error updating task in Firebase:', error);
    this.dragState.draggedTask!.column = oldColumn;
  }
  // Column drag event handlers for HTML5 drag API compatibility
  /**
   * Handles drag over events on columns.
   * 
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
    this.dragState.setDragOverColumn(column);
  }
  /**
   * Handles drag leave events on columns.
   * 
   * @param event - Drag event
   */
  onColumnDragLeave(event: DragEvent): void {
    if (!event.relatedTarget || !event.currentTarget) return;
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      this.dragState.setDragOverColumn(null);
    }
  }
  /**
   * Handles drop events on columns.
   * 
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
    if (this.dragState.draggedTask) {
      this.dragState.setDragOverColumn(column);
      // Drop logic is handled in finishTaskDrag
    }
  }
  /**
   * Public method for updating drag position (used by touch handler).
   * 
   * @param clientX - Current X position
   * @param clientY - Current Y position
   */
  updateDragPosition(clientX: number, clientY: number): void {
    this.updateTaskDragWithPlaceholder(clientX, clientY);
  }
  /**
   * Cleanup method to stop all drag operations and clean up state.
   */
  cleanup(): void {
    this.dragState.resetDragState();
    this.autoScroll.cleanup();
    this.touchHandler.cleanup();
  }
}

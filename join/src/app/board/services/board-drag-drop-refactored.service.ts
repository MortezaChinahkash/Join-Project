import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardThumbnailService } from './board-thumbnail.service';
import { BoardDragStateService } from './drag-drop/board-drag-state.service';
import { BoardDragAutoScrollService } from './drag-drop/board-drag-auto-scroll.service';
import { BoardDragDetectionService } from './drag-drop/board-drag-detection.service';
import { BoardDragMouseHandlerService } from './drag-drop/board-drag-mouse-handler.service';
import { BoardDragTouchHandlerService } from './drag-drop/board-drag-touch-handler.service';
import { BoardDragVisualService } from './drag-drop/board-drag-visual.service';
/**
 * Refactored main service for handling drag & drop functionality in the board component.
 * Orchestrates the drag and drop operations using specialized sub-services.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardDragDropService {
  /**
   * Constructor initializes drag and drop service with required dependencies
   */
  constructor(
    private taskService: TaskService,
    private boardThumbnailService: BoardThumbnailService,
    private dragState: BoardDragStateService,
    private autoScroll: BoardDragAutoScrollService,
    private dragDetection: BoardDragDetectionService,
    private mouseHandler: BoardDragMouseHandlerService,
    private touchHandler: BoardDragTouchHandlerService,
    private visualService: BoardDragVisualService
  ) {}
  get draggedTask() { return this.dragState.draggedTask; }

  get isDraggingTask() { return this.dragState.isDraggingTask; }

  get dragOverColumn() { return this.dragState.dragOverColumn; }

  get dragPlaceholderVisible() { return this.dragState.dragPlaceholderVisible; }

  get dragPlaceholderHeight() { return this.dragState.dragPlaceholderHeight; }

  /**
   * Handles mouse down events on tasks for desktop drag & drop functionality.
   * Initiates task dragging with left mouse button click and sets up mouse event listeners.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a click
   */
  onTaskMouseDown(event: MouseEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    const startDragCallback = (clientX: number, clientY: number, task: Task, element: HTMLElement) => {
      this.startTaskDrag(clientX, clientY, task, element);
    };
    
    const endDragCallback = (onTaskUpdate: () => void) => {
      this.endTaskDrag(onTaskUpdate);
    };

    return this.mouseHandler.onTaskMouseDown(event, task, onTaskUpdate, startDragCallback, endDragCallback);
  }

  /**
   * Handles touch start events on tasks for mobile drag & drop functionality.
   * Uses long press to initiate dragging on touch devices.
   * 
   * @param event - The touch event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a tap
   */
  onTaskTouchStart(event: TouchEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    const startDragCallback = (clientX: number, clientY: number, task: Task, element: HTMLElement) => {
      this.startTaskDrag(clientX, clientY, task, element);
    };
    
    const endDragCallback = (onTaskUpdate: () => void) => {
      this.endTaskDrag(onTaskUpdate);
    };

    const updateDragCallback = (clientX: number, clientY: number) => {
      this.updateTaskDrag(clientX, clientY);
    };

    return this.touchHandler.onTaskTouchStart(event, task, onTaskUpdate, startDragCallback, endDragCallback, updateDragCallback);
  }

  /**
   * Initiates the task dragging process by creating a visual clone and setting up drag state.
   * 
   * @param clientX - The X coordinate of the mouse/touch position
   * @param clientY - The Y coordinate of the mouse/touch position  
   * @param task - The task object being dragged
   * @param element - The HTML element that triggered the drag
   * @private
   */
  private startTaskDrag(clientX: number, clientY: number, task: Task, element: HTMLElement): void {
    this.initializeDragState(task, clientX, clientY);
    const taskCard = element.closest('.task-card') as HTMLElement;
    if (taskCard) {
      this.visualService.startDragVisualization(taskCard, clientX, clientY);
    }
  }

  /**
   * Initializes the basic drag state properties.
   * 
   * @param task - The task being dragged
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @private
   */
  private initializeDragState(task: Task, clientX: number, clientY: number): void {
    this.dragState.draggedTask = task;
    this.dragState.isDraggingTask = true;
    this.dragState.dragStartPosition = { x: clientX, y: clientY };
  }

  /**
   * Creates and configures the visual drag element.
   * 
   * @param taskCard - The original task card element
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @private
   */
  private createAndConfigureDragElement(taskCard: HTMLElement, clientX: number, clientY: number): void {
    this.dragState.dragElement = taskCard.cloneNode(true) as HTMLElement;
    this.configureDragElementStyles(taskCard);
    this.calculateDragOffset(taskCard, clientX, clientY);
    this.finalizeDragElement(taskCard);
  }

  /**
   * Configures the visual styles for the drag element.
   * 
   * @param taskCard - The original task card element
   * @private
   */
  private configureDragElementStyles(taskCard: HTMLElement): void {
    const dragElement = this.dragState.dragElement!;
    dragElement.style.position = 'fixed';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.zIndex = '9999';
    dragElement.style.transform = 'rotate(5deg)';
    dragElement.style.transition = 'none';
    dragElement.style.width = taskCard.offsetWidth + 'px';
    dragElement.style.height = taskCard.offsetHeight + 'px';
    dragElement.classList.add('task-dragging');
  }

  /**
   * Calculates and sets the drag offset from cursor to element.
   * 
   * @param taskCard - The original task card element
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @private
   */
  private calculateDragOffset(taskCard: HTMLElement, clientX: number, clientY: number): void {
    const rect = taskCard.getBoundingClientRect();
    this.dragState.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    this.dragState.updateDragElementPosition(clientX, clientY);
  }

  /**
   * Finalizes the drag element setup and adds it to the DOM.
   * 
   * @param taskCard - The original task card element
   * @private
   */
  private finalizeDragElement(taskCard: HTMLElement): void {
    document.body.appendChild(this.dragState.dragElement!);
    taskCard.classList.add('task-dragging-original');
    this.dragState.dragPlaceholderHeight = taskCard.offsetHeight;
  }

  /**
   * Updates the position of the dragged task element and determines target column.
   * 
   * @param clientX - The current X coordinate of the mouse/touch position
   * @param clientY - The current Y coordinate of the mouse/touch position
   * @private
   */
  private updateTaskDrag(clientX: number, clientY: number): void {
    if (!this.dragState.isDraggingTask || !this.dragState.dragElement) return;
    this.autoScroll.handleAutoScroll(clientY);
    this.dragState.updateDragElementPosition(clientX, clientY);
    const targetColumn = this.dragDetection.getColumnAtPosition(clientX, clientY);
    this.dragState.updateDragOverColumn(targetColumn);
  }

  /**
   * Handles drag over events on board columns to show visual feedback.
   * 
   * @param event - The drag event from the column
   * @param column - The target column being dragged over
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    if (this.dragState.isDraggingTask && this.dragState.draggedTask && column !== this.dragState.draggedTask.column) {
      event.preventDefault();
      this.dragState.updateDragOverColumn(column);
    }
  }

  /**
   * Handles drag leave events on board columns to hide placeholder.
   * 
   * @param event - The drag leave event from the column
   */
  onColumnDragLeave(event: DragEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      this.dragState.updateDragOverColumn(null);
    }
  }

  /**
   * Handles drop events on board columns.
   * 
   * @param event - The drop event from the column
   * @param column - The target column where the task is being dropped
   */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
  }

  /**
   * Ends the task drag operation and updates task position if dropped on valid target.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @private
   */
  private endTaskDrag(onTaskUpdate: () => void): void {
    if (!this.dragState.draggedTask) return;
    if (this.dragState.dragOverColumn && this.dragState.dragOverColumn !== this.dragState.draggedTask.column) {
      this.dragState.draggedTask.column = this.dragState.dragOverColumn;
      this.taskService.updateTask(this.dragState.draggedTask.id!, this.dragState.draggedTask);
      onTaskUpdate();
    }
    this.visualService.endDragVisualization();
    this.resetDragState();
  }

  /**
   * Resets all drag & drop state variables.
   */
  resetDragState(): void {
    this.dragState.resetDragState();
    this.autoScroll.stopAutoScroll();
  }
}

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Contact } from '../../contacts/services/contact-data.service';
import { Task } from '../../interfaces/task.interface';
import { BoardFormService } from '../services/board-form.service';
import { BoardUtilsService } from '../services/board-utils.service';
import { DeleteConfirmationService } from '../../shared/services/delete-confirmation.service';
import { TaskEditOverlayService } from '../services/task-edit-overlay.service';
import { ContactHelperService } from '../../contacts/services/contact-helper.service';

/**
 * Task details overlay component for displaying detailed task information.
 * Handles task details display, subtask toggling, editing, and deletion.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-task-details-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-details-overlay.component.html',
  styleUrl: './task-details-overlay.component.scss',
  animations: [
    trigger('slideInRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('350ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class TaskDetailsOverlayComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Input() selectedTask: Task | null = null;
  @Input() contacts: Contact[] = [];

  @Output() onClose = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Output() onSubtaskToggle = new EventEmitter<number>();

  constructor(
    public formService: BoardFormService,
    public utilsService: BoardUtilsService,
    public deleteConfirmationService: DeleteConfirmationService,
    public taskEditOverlayService: TaskEditOverlayService,
    public contactHelperService: ContactHelperService
  ) {}

  ngOnInit(): void {
    // Component initialization if needed
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Closes the task details overlay.
   */
  closeTaskDetailsOverlay(): void {
    this.onClose.emit();
  }

  /**
   * Enters edit mode for the selected task.
   */
  editTask(): void {
    this.onEdit.emit();
  }

  /**
   * Deletes the selected task.
   */
  deleteTask(): void {
    this.onDelete.emit();
  }

  /**
   * Toggles subtask completion status.
   * @param subtaskIndex - Index of the subtask to toggle
   */
  toggleSubtask(subtaskIndex: number): void {
    this.onSubtaskToggle.emit(subtaskIndex);
  }

  /**
   * Gets the selected task's due date for display.
   * @returns Due date string or null
   */
  get selectedTaskDueDate(): string | null {
    if (!this.selectedTask || !this.selectedTask.dueDate) {
      return null;
    }
    const dueDate = this.selectedTask.dueDate.trim();
    return dueDate !== '' ? dueDate : null;
  }

  /**
   * Checks if the selected task has a due date.
   * @returns True if task has a due date, false otherwise
   */
  hasDueDate(): boolean {
    return !!(this.selectedTask && this.selectedTask.dueDate && this.selectedTask.dueDate.trim() !== '');
  }

  /**
   * Gets the formatted due date for display.
   * @returns Formatted due date string or null
   */
  getFormattedDueDate(): string | null {
    if (!this.selectedTask || !this.selectedTask.dueDate) {
      return null;
    }
    return this.selectedTask.dueDate;
  }

  /**
   * Gets initials from contact name for avatar display.
   * @param name - Full name of the contact
   * @returns Initials (first letter of first and last name)
   */
  getInitials(name: string): string {
    return this.contactHelperService.getInitials(name);
  }

  /**
   * Gets background color for contact avatar based on name.
   * @param name - Full name of the contact
   * @returns Hex color string
   */
  getInitialsColor(name: string): string {
    return this.contactHelperService.getInitialsColor(name);
  }
}


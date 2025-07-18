import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../interfaces/task.interface';
import { Contact } from '../../services/contact-data.service';
import { BoardFormService } from '../../services/board-form.service';
import { BoardUtilsService } from '../../services/board-utils.service';
import { DeleteConfirmationService } from '../../services/delete-confirmation.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Task Details Overlay component for displaying task information.
 * Shows detailed task information with edit and delete options.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-task-details-overlay',
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
export class TaskDetailsOverlayComponent {
  @Input() task: Task | null = null;
  @Input() contacts: Contact[] = [];
  @Input() isVisible: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() toggleSubtaskEvent = new EventEmitter<number>();

  constructor(
    public formService: BoardFormService,
    public utilsService: BoardUtilsService,
    private deleteConfirmationService: DeleteConfirmationService
  ) {}

  /**
   * Handles closing the overlay.
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Öffnet die Task-Details.
   */
  openTaskDetails(task: Task): void {
    this.formService.openTaskDetails(task);
    this.close.emit();
  }

  /**
   * Bearbeitet den Task.
   */
  editTask(): void {
    this.formService.editTask(this.contacts);
    this.edit.emit();
  }

  /**
   * Löscht den Task.
   */
  async deleteTask(): Promise<void> {
    try {
      if (this.task) {
        this.deleteConfirmationService.deleteTask(this.task);
        this.delete.emit();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  /**
   * Subtask toggeln.
   */
  async toggleSubtask(index: number): Promise<void> {
    await this.formService.toggleSubtask(index, () => {
      this.toggleSubtaskEvent.emit(index);
    });
  }

  /**
   * Gets initials from contact name for avatar display.
   * @param name - Full name of the contact
   * @returns Initials (first letter of first and last name)
   */
  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Checks if the task has a due date.
   * @returns True if task has a due date, false otherwise
   */
  hasDueDate(): boolean {
    const hasDate = !!(this.task && this.task.dueDate && this.task.dueDate.trim() !== '');
    console.log('DEBUG hasDueDate:', {
      task: this.task,
      priority: this.task?.priority,
      dueDate: this.task?.dueDate,
      dueDateType: typeof this.task?.dueDate,
      dueDateValue: this.task?.dueDate,
      hasDate: hasDate
    });
    return hasDate;
  }

  /**
   * Gets the formatted due date for display.
   * @returns Formatted due date string or null
   */
  getFormattedDueDate(): string | null {
    if (!this.task || !this.task.dueDate) {
      return null;
    }
    console.log('DEBUG getFormattedDueDate:', {
      priority: this.task.priority,
      dueDate: this.task.dueDate,
      dueDateType: typeof this.task.dueDate
    });
    return this.task.dueDate;
  }

  /**
   * Gets background color for contact avatar based on name.
   * Uses the same color logic as the contacts component.
   * @param name - Full name of the contact
   * @returns Hex color string
   */
  getInitialsColor(name: string): string {
    if (!name?.trim()) return '#888';
    
    // Same color palette as ContactOrganizationService
    const colors = [
      '#FFB900', '#D83B01', '#B50E0E', '#E81123',
      '#B4009E', '#5C2D91', '#0078D7', '#00B4FF',
      '#008272', '#107C10', '#7FBA00', '#F7630C',
      '#CA5010', '#EF6950', '#E74856', '#0099BC',
      '#7A7574', '#767676', '#FF8C00', '#E3008C',
      '#68217A', '#00188F', '#00BCF2', '#00B294',
      '#BAD80A', '#FFF100',
    ];
    
    // Same calculation logic as ContactOrganizationService
    const letter = name.trim()[0].toUpperCase();
    const colorIndex = letter.charCodeAt(0) - 65; // A=0, B=1, etc.
    return colors[colorIndex % colors.length];
  }
}

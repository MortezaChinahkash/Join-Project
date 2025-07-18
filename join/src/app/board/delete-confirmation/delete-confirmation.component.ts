import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../interfaces/task.interface';

/**
 * Delete Confirmation Component
 * Reusable component for confirming task deletion with a modal overlay.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-delete-confirmation',
  imports: [CommonModule],
  templateUrl: './delete-confirmation.component.html',
  styleUrl: './delete-confirmation.component.scss'
})
export class DeleteConfirmationComponent {
  /**
   * Controls the visibility of the delete confirmation overlay
   */
  @Input() isVisible: boolean = false;

  /**
   * The task that is marked for deletion
   */
  @Input() taskToDelete: Task | null = null;

  /**
   * Emitted when the user cancels the deletion
   */
  @Output() onCancel = new EventEmitter<void>();

  /**
   * Emitted when the user confirms the deletion
   */
  @Output() onConfirm = new EventEmitter<void>();

  /**
   * Handles the cancel action
   */
  cancel(): void {
    this.onCancel.emit();
  }

  /**
   * Handles the confirm action
   */
  confirm(): void {
    this.onConfirm.emit();
  }
}


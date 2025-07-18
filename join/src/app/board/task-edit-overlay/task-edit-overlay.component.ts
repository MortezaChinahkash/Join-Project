import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Task } from '../../interfaces/task.interface';
import { Contact } from '../../services/contact-data.service';
import { BoardFormService } from '../../services/board-form.service';
import { BoardSubtaskService } from '../../services/board-subtask.service';
import { FlatpickrDirective } from '../../directives/flatpickr.directive';

/**
 * Task Edit Overlay Component
 * Standalone component for editing existing tasks with a modal overlay.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-task-edit-overlay',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FlatpickrDirective],
  templateUrl: './task-edit-overlay.component.html',
  styleUrl: './task-edit-overlay.component.scss'
})
export class TaskEditOverlayComponent {
  
  /**
   * Controls the visibility of the edit overlay
   */
  @Input() isVisible: boolean = false;

  /**
   * The task being edited
   */
  @Input() selectedTask: Task | null = null;

  /**
   * Array of contacts for assignment
   */
  @Input() contacts: Contact[] = [];

  /**
   * Current subtask title for adding new subtasks
   */
  newSubtaskTitle: string = '';

  /**
   * Index of the subtask currently being edited
   */
  editingSubtaskIndex: number | null = null;

  /**
   * Emitted when the overlay should be closed
   */
  @Output() onClose = new EventEmitter<void>();

  /**
   * Emitted when task changes should be saved
   */
  @Output() onSave = new EventEmitter<void>();

  constructor(
    public formService: BoardFormService,
    private subtaskService: BoardSubtaskService
  ) {}

  /**
   * Gets the initials color for a contact
   */
  getInitialsColor(name: string): string {
    const colors = ['#ff7a00', '#ff5eb3', '#6e52ff', '#9327ff', '#00bee8', '#1fd7c1', '#ff745e', '#ffa35e', '#fc71ff', '#ffc701', '#0038ff', '#c3ff2b', '#ffe62b', '#ff4646', '#ffbb2b'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  /**
   * Gets the initials from a contact name
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Closes the edit overlay
   */
  cancel(): void {
    this.editingSubtaskIndex = null;
    this.newSubtaskTitle = '';
    this.onClose.emit();
  }

  /**
   * Saves the task changes
   */
  save(): void {
    this.editingSubtaskIndex = null;
    this.newSubtaskTitle = '';
    this.onSave.emit();
  }

  /**
   * Starts editing a specific subtask
   */
  editSubtask(index: number): void {
    this.editingSubtaskIndex = index;
    this.subtaskService.focusSubtaskInput(index);
  }

  /**
   * Stops editing the current subtask
   */
  stopEditingSubtask(): void {
    this.editingSubtaskIndex = null;
  }

  /**
   * Handles subtask input focus
   */
  onSubtaskInputFocus(index: number): void {
    if (this.editingSubtaskIndex === index) {
      this.editSubtask(index);
    }
  }

  /**
   * Adds a new subtask to the form
   */
  addNewSubtask(): void {
    if (this.newSubtaskTitle.trim()) {
      this.subtaskService.addSubtaskToForm(
        this.newSubtaskTitle,
        this.formService.subtasksFormArray,
        this.formService.createSubtaskGroup.bind(this.formService)
      );
      this.newSubtaskTitle = '';
    }
  }
}

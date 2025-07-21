import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Task } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';
import { BoardFormService } from '../services/board-form.service';
import { BoardSubtaskService } from '../services/board-subtask.service';
import { ContactHelperService } from '../../contacts/services/contact-helper.service';
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
export class TaskEditOverlayComponent implements OnDestroy {
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
   * Indicates if the device supports touch
   */
  isTouchDevice: boolean = false;
  /**
   * Document click listener for outside click detection
   */
  private documentClickListener?: (event: Event) => void;
  /**
   * Document click listener for dropdown outside click detection
   */
  private dropdownClickListener?: (event: Event) => void;
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
    private subtaskService: BoardSubtaskService,
    public contactHelperService: ContactHelperService
  ) {
    this.detectTouchDevice();
    /**
     * Setup dropdown listener after a short delay to ensure DOM is ready
     */
    setTimeout(() => {
      this.setupDropdownClickListener();
    }, 0);
  }

  /**
   * Sets up document click listener for dropdown
   */
  private setupDropdownClickListener(): void {
    this.removeDropdownClickListener();
    this.dropdownClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const dropdownContainer = target.closest('.contacts-dropdown');
      const dropdownTrigger = target.closest('.dropdown-trigger');
      /**
       * Also check for AddTaskOverlay dropdown elements
       */
      const addTaskDropdownWrapper = target.closest('.custom-select-wrapper');
      const addTaskDropdownOption = target.closest('.dropdown-option');
      /**
       * Don't close if clicking on AddTaskOverlay dropdown elements
       */
      if (addTaskDropdownWrapper || addTaskDropdownOption) {
        return;
      }

      /**
       * Close dropdown if clicked outside and dropdown is open
       */
      if (!dropdownContainer && this.formService.isDropdownOpen) {
        this.formService.isDropdownOpen = false;
      }

      /**
       * Don't close if clicking on the trigger (let the toggle handle it)
       */
      else if (dropdownTrigger) {
        return;
      }
    };
    /** Use capture phase */
    document.addEventListener('click', this.dropdownClickListener, true);
  }

  /**
   * Removes dropdown click listener
   */
  private removeDropdownClickListener(): void {
    if (this.dropdownClickListener) {
      /** Use capture phase */
      document.removeEventListener('click', this.dropdownClickListener, true);
      this.dropdownClickListener = undefined;
    }
  }

  /**
   * Detects if the device supports touch
   */
  private detectTouchDevice(): void {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Sets up document click listener when editing starts
   */
  private setupDocumentClickListener(): void {
    this.removeDocumentClickListener();
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const subtaskContainer = target.closest('.subtask-input-group');
      const isActionButton = target.closest('.subtask-input-actions');
      if (!subtaskContainer && !isActionButton && this.editingSubtaskIndex !== null) {
        this.saveSubtaskEdit();
      }
    };

    document.addEventListener('click', this.documentClickListener);
  }

  /**
   * Removes document click listener
   */
  private removeDocumentClickListener(): void {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
      this.documentClickListener = undefined;
    }
  }

  /**
   * Gets the initials color for a contact
   */
  getInitialsColor(name: string): string {
    return this.contactHelperService.getInitialsColor(name);
  }

  /**
   * Gets the initials from a contact name
   */
  getInitials(name: string): string {
    return this.contactHelperService.getInitials(name);
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
    this.setupDocumentClickListener();
    this.subtaskService.focusSubtaskInput(index);
  }

  /**
   * Stops editing the current subtask
   */
  stopEditingSubtask(): void {
    this.editingSubtaskIndex = null;
    this.removeDocumentClickListener();
  }

  /**
   * Handles subtask input focus
   */
  onSubtaskInputFocus(index: number): void {
    if (this.editingSubtaskIndex !== index) {
      this.editSubtask(index);
    }
  }

  /**
   * Handles subtask input blur - auto saves the subtask
   */
  onSubtaskInputBlur(index: number): void {
    setTimeout(() => {
      if (this.editingSubtaskIndex === index) {
        this.saveSubtaskEdit();
      }
    }, 150);
  }

  /**
   * Saves the current subtask edit
   */
  saveSubtaskEdit(): void {
    this.editingSubtaskIndex = null;
    this.removeDocumentClickListener();
  }

  /**
   * Cancels the current subtask edit and reverts changes
   */
  cancelSubtaskEdit(index: number): void {
    /** Revert to original value if needed */
    this.editingSubtaskIndex = null;
    this.removeDocumentClickListener();
  }

  /**
   * Deletes a subtask
   */
  deleteSubtask(index: number): void {
    this.formService.removeSubtask(index);
    this.editingSubtaskIndex = null;
    this.removeDocumentClickListener();
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

  /**
   * Cleanup when component is destroyed
   */
  ngOnDestroy(): void {
    this.removeDocumentClickListener();
    this.removeDropdownClickListener();
  }
}

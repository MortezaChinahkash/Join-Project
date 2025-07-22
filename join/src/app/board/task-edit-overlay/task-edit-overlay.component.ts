import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Task } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';
import { BoardFormService } from '../services/board-form.service';
import { BoardFormContactService } from '../services/board-form-contact.service';
import { BoardFormCategoryService } from '../services/board-form-category.service';
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
    public contactService: BoardFormContactService,
    public categoryService: BoardFormCategoryService,
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
    this.dropdownClickListener = this.createDropdownClickHandler();
    document.addEventListener('click', this.dropdownClickListener, true);
  }

  /**
   * Creates the dropdown click handler function.
   * 
   * @returns Click handler function
   * @private
   */
  private createDropdownClickHandler(): (event: Event) => void {
    return (event: Event) => {
      const target = event.target as HTMLElement;
      const targetElements = this.getTargetElements(target);
      this.handleDropdownClick(targetElements);
    };
  }

  /**
   * Gets relevant DOM elements for dropdown click handling.
   * 
   * @param target - Event target element
   * @returns Object with relevant elements
   * @private
   */
  private getTargetElements(target: HTMLElement): {
    dropdownContainer: Element | null;
    dropdownTrigger: Element | null;
    addTaskDropdownWrapper: Element | null;
    addTaskDropdownOption: Element | null;
  } {
    return {
      dropdownContainer: target.closest('.contacts-dropdown'),
      dropdownTrigger: target.closest('.dropdown-trigger'),
      addTaskDropdownWrapper: target.closest('.custom-select-wrapper'),
      addTaskDropdownOption: target.closest('.dropdown-option')
    };
  }

  /**
   * Handles dropdown click logic based on target elements.
   * 
   * @param elements - Target elements object
   * @private
   */
  private handleDropdownClick(elements: {
    dropdownContainer: Element | null;
    dropdownTrigger: Element | null;
    addTaskDropdownWrapper: Element | null;
    addTaskDropdownOption: Element | null;
  }): void {
    if (this.isAddTaskDropdownClick(elements)) {
      return;
    }
    
    if (this.shouldCloseDropdown(elements)) {
      this.contactService.isDropdownOpen = false;
    }
  }

  /**
   * Checks if click is on AddTaskOverlay dropdown elements.
   * 
   * @param elements - Target elements object
   * @returns True if click is on AddTask dropdown
   * @private
   */
  private isAddTaskDropdownClick(elements: {
    addTaskDropdownWrapper: Element | null;
    addTaskDropdownOption: Element | null;
  }): boolean {
    return !!(elements.addTaskDropdownWrapper || elements.addTaskDropdownOption);
  }

  /**
   * Determines if dropdown should be closed.
   * 
   * @param elements - Target elements object
   * @returns True if dropdown should close
   * @private
   */
  private shouldCloseDropdown(elements: {
    dropdownContainer: Element | null;
    dropdownTrigger: Element | null;
  }): boolean {
    return !elements.dropdownContainer && 
           !elements.dropdownTrigger && 
           this.contactService.isDropdownOpen;
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

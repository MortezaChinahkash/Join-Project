import { Component, EventEmitter, Input, Output, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Contact } from '../../contacts/services/contact-data.service';
import { TaskColumn } from '../../interfaces/task.interface';
import { BoardFormService } from '../services/board-form.service';
import { BoardFormContactService } from '../services/board-form-contact.service';
import { BoardFormCategoryService } from '../services/board-form-category.service';
import { BoardSubtaskService } from '../services/board-subtask.service';
import { ContactHelperService } from '../../contacts/services/contact-helper.service';
import { FlatpickrDirective } from '../../directives/flatpickr.directive';
import { trigger, transition, style, animate } from '@angular/animations';
/**
 * Add Task Overlay Component
 * Standalone component for creating new tasks with a modal overlay.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-add-task-overlay',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FlatpickrDirective],
  templateUrl: './add-task-overlay.component.html',
  styleUrl: './add-task-overlay.component.scss',
  animations: [
    trigger('slideInRight', [
      transition(':enter', [
        /** Initial state for slide-in animation from right */
        style({ transform: 'translateX(100%)', opacity: 0 }),
        /** Animation to slide element into view */
        animate('350ms cubic-bezier(.35,0,.25,1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class AddTaskOverlayComponent implements OnDestroy {
  /**
   * Controls the visibility of the add task overlay
   */
  @Input() isVisible: boolean = false;
  /**
   * Array of contacts for assignment
   */
  @Input() contacts: Contact[] = [];
  /**
   * Maximum length for task title
   */
  @Input() maxTitleLength: number = 50;
  /**
   * Current subtask title for adding new subtasks
   */
  newSubtaskTitle: string = '';
  /**
   * Emitted when the overlay should be closed
   */
  @Output() onClose = new EventEmitter<void>();
  /**
   * Emitted when a new task should be created
   */
  @Output() onSubmit = new EventEmitter<void>();
  constructor(
    public formService: BoardFormService,
    public contactService: BoardFormContactService,
    public categoryService: BoardFormCategoryService,
    public subtaskService: BoardSubtaskService,
    public contactHelperService: ContactHelperService
  ) {
  }

  /**
   * Track by function for contact list
   */
  trackByContactId(index: number, contact: Contact): string {
    return contact.id || index.toString();
  }

  /**
   * Gets selected contacts from the form service
   */
  getSelectedContacts(contacts: Contact[]): Contact[] {
    return contacts.filter(contact => this.contactService.isContactSelected(contact));
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
   * Closes the add task overlay
   */
  closeAddTaskOverlay(): void {
    this.newSubtaskTitle = '';
    this.onClose.emit();
  }

  /**
   * Handles form submission
   */
  onFormSubmit(): void {


    Object.keys(this.formService.taskForm.controls).forEach(key => {
      this.formService.taskForm.get(key)?.markAsTouched();
    });
    
    if (this.formService.taskForm.valid && !this.formService.validationService.isDateInvalid(this.formService.taskForm, 'dueDate')) {

      this.onSubmit.emit();
    } else {

    }
  }

  /**
   * Handles clicks outside dropdowns to close them
   */
  @HostListener('document:click', ['$event'])
  /**
   * Handles documentclick events.
   * @param event - Event parameter
   */
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (this.categoryService.isCategoryDropdownOpen) {
      const categoryDropdown = target.closest('.category-select-wrapper');
      if (!categoryDropdown) {
        this.categoryService.closeCategoryDropdown();
      }
    }
    
    if (this.contactService.isDropdownOpen) {
      const contactsDropdown = target.closest('.custom-select-wrapper:not(.category-select-wrapper)');
      if (!contactsDropdown) {
      }
    }
  }

  /**
   * Adds a new subtask to the add task form
   */
  addNewSubtaskToAddTask(): void {
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
  }
}

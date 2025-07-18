import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Contact } from '../../services/contact-data.service';
import { TaskColumn } from '../../interfaces/task.interface';
import { BoardFormService } from '../../services/board-form.service';
import { BoardSubtaskService } from '../../services/board-subtask.service';
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
        style({ transform: 'translateX(100%)', opacity: 0 }),
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
   * Document click listener for dropdown outside click detection
   */
  private dropdownClickListener?: (event: Event) => void;

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
    public subtaskService: BoardSubtaskService
  ) {
    // Setup dropdown listener after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.setupDropdownClickListener();
    }, 0);
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
    return contacts.filter(contact => this.formService.isContactSelected(contact));
  }

  /**
   * Sets up document click listener for dropdown
   */
  private setupDropdownClickListener(): void {
    this.removeDropdownClickListener();
    this.dropdownClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const dropdownContainer = target.closest('.custom-select-wrapper');
      const dropdownTrigger = target.closest('.custom-select');
      
      // Close dropdown if clicked outside and dropdown is open
      if (!dropdownContainer && this.formService.isDropdownOpen) {
        this.formService.isDropdownOpen = false;
      }
      // Don't close if clicking on the trigger (let the toggle handle it)
      else if (dropdownTrigger) {
        return;
      }
    };
    document.addEventListener('click', this.dropdownClickListener, true); // Use capture phase
  }

  /**
   * Removes dropdown click listener
   */
  private removeDropdownClickListener(): void {
    if (this.dropdownClickListener) {
      document.removeEventListener('click', this.dropdownClickListener, true); // Use capture phase
      this.dropdownClickListener = undefined;
    }
  }

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
    this.onSubmit.emit();
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
    this.removeDropdownClickListener();
  }
}

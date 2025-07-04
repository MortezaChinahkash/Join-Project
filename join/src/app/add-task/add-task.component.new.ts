import { Component, OnInit, OnDestroy, inject, HostListener, Injector, runInInjectionContext } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ContactsComponent } from '../contacts/contacts.component';
import { Contact } from '../services/contact-data.service';
import { Firestore, collectionData, collection, DocumentData } from '@angular/fire/firestore';
import { Task } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';
import { InlineSvgDirective } from '../inline-svg.directive';
import { BoardFormService } from '../services/board-form.service';

/**
 * Component for adding new tasks to the system.
 * Provides a form interface for creating tasks with various properties
 * including title, description, due date, priority, category, and assigned contacts.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule, InlineSvgDirective],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.scss'
})
export class AddTaskComponent implements OnInit, OnDestroy {
  taskForm: FormGroup;
  selectedPriority: 'urgent' | 'medium' | 'low' | '' = '';
  contacts: Contact[] = [];
  selectedContacts: Contact[] = [];
  
  isDropdownOpen = false;
  isSubmitting = false;
  maxTitleLength: number = 40;
  
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  /**
   * Initializes the component with required services and creates the task form.
   *
   * @param formBuilder - Angular FormBuilder for reactive forms
   * @param taskService - Service for task data operations
   * @param boardFormService - Service for board form management
   */
  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    public boardFormService: BoardFormService
  ) {
    this.taskForm = this.createTaskForm();
  }

  /**
   * Angular lifecycle hook for component initialization.
   */
  ngOnInit(): void {
    this.initializeComponent();
  }

  /**
   * Angular lifecycle hook for component cleanup.
   */
  ngOnDestroy(): void {
    // Cleanup handled automatically by Angular
  }

  /**
   * Creates the reactive form for task creation.
   * @returns Configured FormGroup
   */
  private createTaskForm(): FormGroup {
    return this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dueDate: ['', Validators.required],
      priority: ['', Validators.required],
      category: ['', Validators.required],
      assignedTo: [[]],
      subtasks: this.formBuilder.array([])
    });
  }

  /**
   * Initializes component data and state.
   */
  private async initializeComponent(): Promise<void> {
    this.setDefaultFormValues();
    await this.loadContactsData();
  }

  /**
   * Sets default values for the form.
   */
  private setDefaultFormValues(): void {
    this.selectedPriority = 'medium';
    this.taskForm.patchValue({ priority: 'medium' });
  }

  /**
   * Loads contacts from Firestore.
   */
  private async loadContactsData(): Promise<void> {
    try {
      const contactsCollection = collection(this.firestore, 'contacts');
      this.subscribeToContacts(contactsCollection);
    } catch (error) {
      this.handleContactsLoadError(error);
    }
  }

  /**
   * Subscribes to contacts collection updates.
   * @param contactsCollection - Firestore collection reference
   */
  private subscribeToContacts(contactsCollection: any): void {
    runInInjectionContext(this.injector, () => {
      collectionData(contactsCollection, { idField: 'id' }).subscribe(
        (data: DocumentData[]) => {
          this.contacts = this.processContactsData(data as Contact[]);
        }
      );
    });
  }

  /**
   * Processes and sorts contacts data.
   * @param contactsData - Raw contacts data from Firestore
   * @returns Sorted contacts array
   */
  private processContactsData(contactsData: Contact[]): Contact[] {
    return contactsData.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Handles contacts loading errors.
   * @param error - Error object
   */
  private handleContactsLoadError(error: any): void {
    console.error('Error loading contacts:', error);
  }

  /**
   * Sets the priority level for the task.
   * @param priority - Priority level to set
   */
  setPriority(priority: 'urgent' | 'medium' | 'low'): void {
    this.selectedPriority = priority;
    this.updateFormPriority(priority);
  }

  /**
   * Updates form with selected priority.
   * @param priority - Priority to update in form
   */
  private updateFormPriority(priority: 'urgent' | 'medium' | 'low'): void {
    this.taskForm.patchValue({ priority });
  }

  /**
   * Toggles contact selection dropdown visibility.
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Toggles contact selection state.
   * @param contact - Contact to toggle
   * @param event - Click event
   */
  toggleContactSelection(contact: Contact, event: Event): void {
    event.stopPropagation();
    
    if (this.isContactSelected(contact)) {
      this.removeContactFromSelection(contact);
    } else {
      this.addContactToSelection(contact);
    }
    
    this.updateFormAssignedContacts();
  }

  /**
   * Checks if a contact is currently selected.
   * @param contact - Contact to check
   * @returns True if contact is selected
   */
  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.id === contact.id);
  }

  /**
   * Removes a contact from selection.
   * @param contact - Contact to remove
   */
  private removeContactFromSelection(contact: Contact): void {
    const index = this.selectedContacts.findIndex(c => c.id === contact.id);
    if (index > -1) {
      this.selectedContacts.splice(index, 1);
    }
  }

  /**
   * Adds a contact to selection.
   * @param contact - Contact to add
   */
  private addContactToSelection(contact: Contact): void {
    this.selectedContacts.push(contact);
  }

  /**
   * Updates form with selected contacts.
   */
  private updateFormAssignedContacts(): void {
    const contactNames = this.selectedContacts.map(c => c.name);
    this.taskForm.patchValue({ assignedTo: contactNames });
  }

  /**
   * Gets contact initials for display.
   * @param name - Contact name
   * @returns Initials string
   */
  getInitials(name: string): string {
    return ContactsComponent.getInitials(name);
  }

  /**
   * Gets contact avatar color.
   * @param name - Contact name
   * @returns Hex color string
   */
  getInitialsColor(name: string): string {
    return ContactsComponent.getInitialsColor(name);
  }

  /**
   * Gets the subtasks FormArray from the form.
   * @returns FormArray containing subtasks
   */
  get subtasksFormArray(): FormArray {
    return this.taskForm.get('subtasks') as FormArray;
  }

  /**
   * Adds a new subtask to the form.
   */
  addSubtask(): void {
    const subtaskGroup = this.createSubtaskGroup();
    this.subtasksFormArray.push(subtaskGroup);
  }

  /**
   * Creates a form group for a subtask.
   * @returns FormGroup for subtask
   */
  private createSubtaskGroup(): FormGroup {
    return this.formBuilder.group({
      title: [''],
      completed: [false]
    });
  }

  /**
   * Removes a subtask from the form.
   * @param index - Index of subtask to remove
   */
  removeSubtask(index: number): void {
    this.subtasksFormArray.removeAt(index);
  }

  /**
   * Gets display text for selected contacts.
   * @returns Formatted string of selected contacts
   */
  getSelectedContactsText(): string {
    return this.formatSelectedContactsText(this.selectedContacts);
  }

  /**
   * Formats selected contacts into display text.
   * @param contacts - Selected contacts array
   * @returns Formatted text string
   */
  private formatSelectedContactsText(contacts: Contact[]): string {
    if (contacts.length === 0) return '';
    if (contacts.length === 1) return contacts[0].name;
    if (contacts.length === 2) {
      return contacts.map(c => c.name).join(' and ');
    }
    return `${contacts[0].name} and ${contacts.length - 1} others`;
  }

  /**
   * Handles form submission.
   */
  async onSubmit(): Promise<void> {
    if (!this.canSubmitForm()) return;

    this.setSubmittingState(true);
    
    try {
      const taskData = this.prepareTaskData();
      await this.createTask(taskData);
      this.handleSubmissionSuccess();
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.setSubmittingState(false);
    }
  }

  /**
   * Checks if form can be submitted.
   * @returns True if form is valid and not already submitting
   */
  private canSubmitForm(): boolean {
    if (!this.taskForm.valid) {
      this.markFormGroupTouched();
      return false;
    }
    return !this.isSubmitting;
  }

  /**
   * Sets the submitting state.
   * @param isSubmitting - Submitting state
   */
  private setSubmittingState(isSubmitting: boolean): void {
    this.isSubmitting = isSubmitting;
  }

  /**
   * Prepares task data from form values.
   * @returns Task data object
   */
  private prepareTaskData(): Omit<Task, 'id'> {
    const formValue = this.taskForm.value;
    const validSubtasks = this.filterValidSubtasks(formValue.subtasks || []);
    
    return {
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
      assignedTo: this.selectedContacts.map(c => c.name),
      column: 'todo',
      subtasks: validSubtasks,
      createdAt: new Date()
    };
  }

  /**
   * Filters out empty subtasks.
   * @param subtasks - Array of subtasks from form
   * @returns Array of valid subtasks
   */
  private filterValidSubtasks(subtasks: any[]): any[] {
    return subtasks.filter(subtask => 
      subtask && subtask.title && subtask.title.trim() !== ''
    );
  }

  /**
   * Creates task using task service.
   * @param taskData - Task data to create
   */
  private async createTask(taskData: Omit<Task, 'id'>): Promise<void> {
    await this.taskService.addTaskToFirebase(taskData, 'todo');
  }

  /**
   * Handles successful task creation.
   */
  private handleSubmissionSuccess(): void {
    this.resetForm();
    // Task created successfully
  }

  /**
   * Handles task creation errors.
   * @param error - Error object
   */
  private handleSubmissionError(error: any): void {
    console.error('Error creating task:', error);
  }

  /**
   * Resets the form to initial state.
   */
  resetForm(): void {
    this.taskForm.reset();
    this.clearFormState();
    this.setDefaultFormValues();
  }

  /**
   * Clears form-related state.
   */
  private clearFormState(): void {
    this.selectedContacts = [];
    this.isDropdownOpen = false;
    this.clearAllSubtasks();
  }

  /**
   * Removes all subtasks from form array.
   */
  private clearAllSubtasks(): void {
    while (this.subtasksFormArray.length !== 0) {
      this.subtasksFormArray.removeAt(0);
    }
  }

  /**
   * Marks all form fields as touched for validation display.
   */
  private markFormGroupTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      this.markControlAsTouched(key);
    });
  }

  /**
   * Marks a specific form control as touched.
   * @param controlKey - Key of the form control
   */
  private markControlAsTouched(controlKey: string): void {
    const control = this.taskForm.get(controlKey);
    control?.markAsTouched();
    
    if (control instanceof FormArray) {
      this.markFormArrayControlsTouched(control);
    }
  }

  /**
   * Marks FormArray controls as touched.
   * @param formArray - FormArray to mark as touched
   */
  private markFormArrayControlsTouched(formArray: FormArray): void {
    formArray.controls.forEach(arrayControl => {
      arrayControl.markAsTouched();
    });
  }

  /**
   * Handles document clicks to close dropdown.
   * @param event - Click event
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isDropdownOpen) {
      this.handleDropdownClickOutside(event);
    }
  }

  /**
   * Handles clicks outside dropdown to close it.
   * @param event - Click event
   */
  private handleDropdownClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const isClickInsideDropdown = this.isClickInsideDropdownArea(target);
    
    if (!isClickInsideDropdown) {
      this.isDropdownOpen = false;
    }
  }

  /**
   * Checks if click is inside dropdown area.
   * @param target - Click target element
   * @returns True if click is inside dropdown
   */
  private isClickInsideDropdownArea(target: HTMLElement): boolean {
    const dropdownWrapper = target.closest('.custom-select-wrapper');
    const contactsDropdown = target.closest('.contacts-dropdown');
    return !!(dropdownWrapper || contactsDropdown);
  }

  /**
   * Gets validation error message for a field.
   * @param fieldName - Name of the field
   * @returns Error message string
   */
  getErrorMessage(fieldName: string): string {
    const control = this.taskForm.get(fieldName);
    
    if (!this.hasControlErrors(control)) {
      return '';
    }
    
    return this.formatErrorMessage(fieldName, control!.errors!);
  }

  /**
   * Checks if control has errors and is touched.
   * @param control - Form control to check
   * @returns True if control has errors
   */
  private hasControlErrors(control: any): boolean {
    return control?.errors && control.touched;
  }

  /**
   * Formats error message based on error type.
   * @param fieldName - Field name for message
   * @param errors - Error object
   * @returns Formatted error message
   */
  private formatErrorMessage(fieldName: string, errors: any): string {
    if (errors['required']) {
      return `${fieldName} is required`;
    }
    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `${fieldName} must be at least ${requiredLength} characters`;
    }
    return '';
  }
}

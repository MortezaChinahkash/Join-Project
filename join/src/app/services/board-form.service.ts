import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Contact } from '../contacts/contacts.component';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { TaskService } from './task.service';

/**
 * Service for handling task form operations and overlay management.
 * Manages task creation, editing, form validation, and overlay states.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class BoardFormService {
  taskForm: FormGroup;
  showAddTaskOverlay = false;
  showTaskDetailsOverlay = false;
  selectedTask: Task | null = null;
  isEditingTask = false;
  selectedPriority: 'urgent' | 'medium' | 'low' | '' = '';
  currentColumn: TaskColumn = 'todo';
  
  // Contact selection
  isDropdownOpen = false;
  selectedContacts: Contact[] = [];
  showAssignedContactsDropdown = false;
  
  // Click outside listener cleanup
  private documentClickListener?: (event: Event) => void;
  private assignedContactsClickListener?: (event: Event) => void;
  
  // Delete confirmation overlay
  showDeleteConfirmationOverlay = false;
  taskToDelete: Task | null = null;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService
  ) {
    this.taskForm = this.createTaskForm();
  }

  /**
   * Creates and initializes the reactive task form with validation rules.
   * 
   * @returns FormGroup with all necessary form controls and validators
   * @private
   */
  private createTaskForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      priority: [''], // Priority ist optional, wird über Buttons gesetzt
      assignedTo: [''],
      category: ['', Validators.required],
      subtasks: this.fb.array([])
    });
  }

  /**
   * Opens the add task overlay for a specific column.
   * 
   * @param column - The column where the new task should be created (defaults to 'todo')
   */
  openAddTaskOverlay(column: TaskColumn = 'todo') {
    this.showAddTaskOverlay = true;
    this.currentColumn = column;
    this.resetForm();
  }

  /**
   * Closes the add task overlay and resets the form.
   */
  closeAddTaskOverlay() {
    this.showAddTaskOverlay = false;
    this.isDropdownOpen = false;
    this.removeDocumentClickListener();
    this.resetForm();
  }

  /**
   * Sets the selected priority and updates the form.
   * 
   * @param priority - The priority level to set
   */
  selectPriority(priority: 'urgent' | 'medium' | 'low') {
    this.selectedPriority = priority;
    this.taskForm.patchValue({ priority: priority });
    // Mark priority field as touched to trigger validation
    this.taskForm.get('priority')?.markAsTouched();
  }

  /**
   * Handles category change events and triggers validation.
   * 
   * @param event - Optional change event
   */
  onCategoryChange(event?: Event) {
    // Mark category field as touched when changed
    this.taskForm.get('category')?.markAsTouched();
    
    // Force update validation status
    this.taskForm.get('category')?.updateValueAndValidity();
  }

  /**
   * Resets the task form to its initial state with default values.
   */
  resetForm() {
    this.taskForm.reset();
    this.selectedPriority = '';
    this.selectedContacts = []; // Reset selected contacts
    this.isDropdownOpen = false;
    this.showAssignedContactsDropdown = false;
    this.removeDocumentClickListener();
    this.removeAssignedContactsClickListener();
    
    // Clear all subtasks
    while (this.subtasksFormArray.length !== 0) {
      this.subtasksFormArray.removeAt(0);
    }
    
    // Set today's date as default for due date and medium priority as default
    const today = this.getTodayDateString();
    this.taskForm.patchValue({
      dueDate: today,
      priority: 'medium'
    });
    
    // Set medium as default selected priority
    this.selectedPriority = 'medium';
  }

  /**
   * Gets today's date as a formatted string for date inputs.
   * 
   * @returns Date string in YYYY-MM-DD format
   * @private
   */
    public getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Handles form submission for creating a new task.
   * Validates the form, processes task data, saves to Firebase, and updates local arrays.
   * 
   * @param onTaskUpdate - Callback to update local task arrays after successful creation
   * @returns Promise<void>
   */
  async onSubmit(onTaskUpdate: () => void): Promise<void> {
    // Schritt 1: Alle Felder als berührt markieren
    this.markFormGroupTouched();
    
    // Schritt 2: Prüfen ob das Formular gültig ist
    if (this.taskForm.valid) {
      try {
        // Schritt 3: Task-Daten vorbereiten
        // Filter out empty subtasks - only save subtasks with non-empty titles
        const allSubtasks = this.taskForm.value.subtasks || [];
        const validSubtasks = allSubtasks.filter((subtask: any) => 
          subtask && subtask.title && subtask.title.trim() !== ''
        );

        const taskData: Omit<Task, 'id' | 'createdAt'> = {
          title: this.taskForm.value.title,
          description: this.taskForm.value.description,
          dueDate: this.taskForm.value.dueDate,
          priority: this.selectedPriority,
          assignedTo: this.selectedContacts.map(contact => contact.name),
          category: this.taskForm.value.category,
          subtasks: validSubtasks,
          column: this.currentColumn
        };

        // Schritt 4: Task zu Firebase hinzufügen
        const firebaseId = await this.taskService.addTaskToFirebase({
          ...taskData,
          createdAt: new Date()
        }, this.currentColumn);

        // Schritt 5: Task zu lokalem Service hinzufügen
        const newTask: Task = {
          ...taskData,
          id: firebaseId,
          createdAt: new Date()
        };

        // Schritt 6: Task zum lokalen Array hinzufügen
        this.taskService.addTaskDirectly(newTask, this.currentColumn);

        // Schritt 7: Callback aufrufen um lokale Arrays zu aktualisieren
        onTaskUpdate();

        // Schritt 8: Overlay schließen
        this.closeAddTaskOverlay();

      } catch (error) {
        alert('Fehler beim Erstellen der Task. Bitte versuchen Sie es erneut.');
      }
    }
  }

  /**
   * Marks all form controls as touched to trigger validation display.
   * 
   * @private
   */
  private markFormGroupTouched() {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
      
      // For FormArray controls (like subtasks), mark them as touched but don't validate
      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          arrayControl.markAsTouched();
        });
      }
    });
  }

  /**
   * Checks if a form field is invalid and has been touched.
   * 
   * @param fieldName - The name of the form field to check
   * @returns True if field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Checks if the date field contains a date in the past
   * @param fieldName - The name of the date field to check
   * @param form - Optional FormGroup to check (defaults to service's taskForm)
   * @returns True if date is in the past, false otherwise
   */
  public isDateInvalid(fieldName: string, form?: FormGroup): boolean {
    const targetForm = form || this.taskForm;
    const field = targetForm.get(fieldName);
    
    // If no field or no value, return false (not our concern)
    if (!field?.value) {
      return false;
    }
    
    const selectedDate = new Date(field.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates
    
    return selectedDate < today; // True if date is in the past
  }

  // Contact selection methods
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    
    if (this.isDropdownOpen) {
      this.addDocumentClickListener();
    } else {
      this.removeDocumentClickListener();
    }
  }

  /**
   * Adds document click listener for closing dropdown when clicking outside
   */
  private addDocumentClickListener(): void {
    // Remove existing listener first to avoid duplicates
    this.removeDocumentClickListener();
    
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const dropdownWrapper = target.closest('.custom-select-wrapper');
      const contactsDropdown = target.closest('.contacts-dropdown');
      
      // Close dropdown if click is outside both dropdown structures
      if (!dropdownWrapper && !contactsDropdown && this.isDropdownOpen) {
        this.isDropdownOpen = false;
        this.removeDocumentClickListener();
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
   * Toggles contact selection in the dropdown.
   * 
   * @param contact - The contact to toggle
   * @param event - The click event (to stop propagation)
   */
  toggleContactSelection(contact: Contact, event: Event) {
    event.stopPropagation();
    
    const index = this.selectedContacts.findIndex(c => c.id === contact.id);
    
    if (index === -1) {
      // Kontakt hinzufügen
      this.selectedContacts.push(contact);
    } else {
      // Kontakt entfernen
      this.selectedContacts.splice(index, 1);
    }
  }

  /**
   * Checks if a contact is currently selected.
   * 
   * @param contact - The contact to check
   * @returns True if contact is selected
   */
  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.id === contact.id);
  }

  /**
   * Selects a single contact (for single-select mode).
   * 
   * @param contact - The contact to select
   */
  selectContact(contact: Contact) {
    this.taskForm.patchValue({ assignedTo: contact.id });
    this.isDropdownOpen = false;
  }

  /**
   * Gets the currently selected contact from the form.
   * 
   * @returns The selected contact or null
   */
  getSelectedContact(): Contact | null {
    const selectedId = this.taskForm.get('assignedTo')?.value;
    if (!selectedId) return null;
    // Note: This would need access to contacts array, consider injecting or passing as parameter
    return null;
  }

  /**
   * Gets display text for selected contacts.
   * 
   * @returns Formatted string of selected contact names
   */
  getSelectedContactsText(): string {
    if (this.selectedContacts.length === 0) return '';
    
    if (this.selectedContacts.length === 1) {
      return this.selectedContacts[0].name;
    } else if (this.selectedContacts.length === 2) {
      return this.selectedContacts.map(c => c.name).join(', ');
    } else {
      return `${this.selectedContacts[0].name} +${this.selectedContacts.length - 1} more`;
    }
  }

  // Subtask management
  get subtasksFormArray(): FormArray {
    const formArray = this.taskForm.get('subtasks') as FormArray;
    return formArray;
  }

  /**
   * Adds a new empty subtask to the form array.
   */
  addSubtask() {
    // Don't use required validator to avoid validation errors for empty subtasks
    const subtaskGroup = this.fb.group({
      title: [''], // No validators - empty subtasks will be filtered out on submit
      completed: [false]
    });
    this.subtasksFormArray.push(subtaskGroup);
  }

  /**
   * Removes a subtask from the form array.
   * 
   * @param index - The index of the subtask to remove
   */
  removeSubtask(index: number) {
    this.subtasksFormArray.removeAt(index);
  }

  // Task details and editing
  /**
   * Opens the task details overlay for a specific task.
   * 
   * @param task - The task to display details for
   */
  openTaskDetails(task: Task) {
    this.selectedTask = task;
    this.showTaskDetailsOverlay = true;
    this.isEditingTask = false;
  }

  /**
   * Closes the task details overlay and resets form state.
   */
  closeTaskDetailsOverlay() {
    this.showTaskDetailsOverlay = false;
    this.selectedTask = null;
    this.isEditingTask = false;
    this.showAssignedContactsDropdown = false;
    this.isDropdownOpen = false;
    this.removeDocumentClickListener();
    this.removeAssignedContactsClickListener();
    this.resetForm();
  }

  /**
   * Switches from task details view to edit mode.
   * Populates the form with current task data for editing.
   * 
   * @param contacts - Array of available contacts for assignment
   */
  editTask(contacts: Contact[]) {
    if (!this.selectedTask) return;
    
    // Close task details overlay and open edit overlay
    this.showTaskDetailsOverlay = false;
    this.isEditingTask = true;
    
    // Clear existing subtasks
    while (this.subtasksFormArray.length !== 0) {
      this.subtasksFormArray.removeAt(0);
    }
    
    // Populate form with selected task data
    this.taskForm.patchValue({
      title: this.selectedTask.title,
      description: this.selectedTask.description,
      dueDate: this.selectedTask.dueDate,
      priority: this.selectedTask.priority,
      category: this.selectedTask.category
    });
    
    this.selectedPriority = this.selectedTask.priority || '';
    
    // Set selected contacts
    this.selectedContacts = this.selectedTask.assignedTo ? 
      contacts.filter(contact => this.selectedTask!.assignedTo!.includes(contact.name)) : [];
      
    // Load subtasks
    if (this.selectedTask.subtasks) {
      this.selectedTask.subtasks.forEach(subtask => {
        const subtaskGroup = this.fb.group({
          title: [subtask.title],
          completed: [subtask.completed]
        });
        this.subtasksFormArray.push(subtaskGroup);
      });
    }
  }

  /**
   * Cancels task editing and returns to task details view.
   */
  cancelEditTask() {
    this.isEditingTask = false;
    this.showTaskDetailsOverlay = true;
    this.resetForm();
  }

  /**
   * Saves changes to the currently selected task.
   * 
   * @param onTaskUpdate - Callback to update local task arrays after successful save
   * @returns Promise<void>
   */
  async saveTaskChanges(onTaskUpdate: () => void): Promise<void> {
    if (!this.selectedTask || !this.taskForm.valid) return;

    try {
      const updatedTask: Task = {
        ...this.selectedTask,
        title: this.taskForm.value.title,
        description: this.taskForm.value.description,
        dueDate: this.taskForm.value.dueDate,
        priority: this.selectedPriority as any,
        category: this.taskForm.value.category,
        assignedTo: this.selectedContacts.map(contact => contact.name),
        subtasks: this.taskForm.value.subtasks || []
      };

      await this.taskService.updateTaskInFirebase(updatedTask);
      
      // Call the update callback to refresh local arrays
      onTaskUpdate();

      this.selectedTask = updatedTask;
      this.isEditingTask = false;
      this.showTaskDetailsOverlay = true; // Return to task details overlay
    } catch (error) {
      console.error('❌ Error updating task:', error);
    }
  }

  /**
   * Opens the delete confirmation overlay for the currently selected task.
   */
  openDeleteConfirmation(): void {
    if (!this.selectedTask) return;
    this.taskToDelete = this.selectedTask;
    this.showDeleteConfirmationOverlay = true;
  }

  /**
   * Closes the delete confirmation overlay and resets the task to delete.
   */
  closeDeleteConfirmation(): void {
    this.showDeleteConfirmationOverlay = false;
    this.taskToDelete = null;
  }

  /**
   * Confirms and deletes the task after user confirmation.
   * 
   * @param onTaskUpdate - Callback to update local task arrays after successful deletion
   * @returns Promise<void>
   */
  async confirmDeleteTask(onTaskUpdate: () => void): Promise<void> {
    if (!this.taskToDelete || !this.taskToDelete.id) return;

    try {
      await this.taskService.deleteTaskFromFirebase(this.taskToDelete.id);
      
      // Call the update callback to refresh local arrays
      onTaskUpdate();

      this.closeDeleteConfirmation();
      this.closeTaskDetailsOverlay();
    } catch (error) {
      console.error('❌ Error deleting task:', error);
    }
  }

  /**
   * Legacy method for backwards compatibility - now opens the confirmation overlay.
   * 
   * @param onTaskUpdate - Callback to update local task arrays after successful deletion
   * @returns Promise<void>
   */
  async deleteTask(onTaskUpdate: () => void): Promise<void> {
    this.openDeleteConfirmation();
  }

  /**
   * Toggles the completion status of a subtask and auto-saves changes.
   * 
   * @param subtaskIndex - The index of the subtask to toggle
   * @param onTaskUpdate - Callback to update local task arrays after save
   */
  async toggleSubtask(subtaskIndex: number, onTaskUpdate: () => void) {
    if (!this.selectedTask?.subtasks) return;
    
    this.selectedTask.subtasks[subtaskIndex].completed = !this.selectedTask.subtasks[subtaskIndex].completed;
    
    // Auto-save subtask changes
    await this.saveTaskChanges(onTaskUpdate);
  }

  // Assigned contacts dropdown methods for task details
  toggleAssignedContactsDropdown(): void {
    this.showAssignedContactsDropdown = !this.showAssignedContactsDropdown;
    
    if (this.showAssignedContactsDropdown) {
      this.addAssignedContactsClickListener();
    } else {
      this.removeAssignedContactsClickListener();
    }
  }

  /**
   * Adds document click listener for closing assigned contacts dropdown when clicking outside
   */
  private addAssignedContactsClickListener(): void {
    // Remove existing listener first to avoid duplicates
    this.removeAssignedContactsClickListener();
    
    // Use a slight delay to avoid immediate closure from the same click that opened it
    setTimeout(() => {
      this.assignedContactsClickListener = (event: Event) => {
        const target = event.target as HTMLElement;
        const dropdownContainer = target.closest('.more-contacts-dropdown');
        
        // Close dropdown if click is outside the dropdown container
        if (!dropdownContainer && this.showAssignedContactsDropdown) {
          this.showAssignedContactsDropdown = false;
          this.removeAssignedContactsClickListener();
        }
      };
      
      document.addEventListener('click', this.assignedContactsClickListener);
    }, 10);
  }

  /**
   * Removes assigned contacts document click listener
   */
  private removeAssignedContactsClickListener(): void {
    if (this.assignedContactsClickListener) {
      document.removeEventListener('click', this.assignedContactsClickListener);
      this.assignedContactsClickListener = undefined;
    }
  }

  /**
   * Gets the first 2 assigned contacts for display.
   * 
   * @returns Array of contact names to display
   */
  getDisplayedAssignedContacts(): string[] {
    if (!this.selectedTask?.assignedTo) return [];
    return this.selectedTask.assignedTo.slice(0, 2);
  }

  /**
   * Checks if there are more than 2 assigned contacts.
   * 
   * @returns True if more contacts than display limit
   */
  hasMoreAssignedContacts(): boolean {
    return this.selectedTask?.assignedTo ? this.selectedTask.assignedTo.length > 2 : false;
  }

  /**
   * Gets the count of remaining assigned contacts not displayed.
   * 
   * @returns Number of remaining contacts
   */
  getRemainingAssignedContactsCount(): number {
    if (!this.selectedTask?.assignedTo || this.selectedTask.assignedTo.length <= 2) return 0;
    return this.selectedTask.assignedTo.length - 2;
  }

  /**
   * Gets the list of remaining assigned contacts for dropdown.
   * 
   * @returns Array of remaining contact names
   */
  getRemainingAssignedContacts(): string[] {
    if (!this.selectedTask?.assignedTo) return [];
    return this.selectedTask.assignedTo.slice(2);
  }

  /**
   * Gets the percentage of completed subtasks for the currently selected task.
   * 
   * @returns Progress percentage (0-100)
   */
  getSubtaskProgress(): number {
    if (!this.selectedTask?.subtasks || this.selectedTask.subtasks.length === 0) return 0;
    const completed = this.selectedTask.subtasks.filter(subtask => subtask.completed).length;
    return (completed / this.selectedTask.subtasks.length) * 100;
  }

  /**
   * Gets the count of completed subtasks for the currently selected task.
   * 
   * @returns Number of completed subtasks
   */
  getCompletedSubtasksCount(): number {
    if (!this.selectedTask?.subtasks) return 0;
    return this.selectedTask.subtasks.filter(subtask => subtask.completed).length;
  }
}



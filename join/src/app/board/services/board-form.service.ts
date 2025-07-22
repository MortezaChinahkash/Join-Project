import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BoardFormValidationService } from './board-form-validation.service';
import { BoardFormOverlayService } from './board-form-overlay-v2.service';
import { BoardFormContactSelectionService } from './board-form-contact-selection.service';
import { BoardFormDataService } from './board-form-data.service';
import { BoardFormTaskOperationsService } from './board-form-task-operations.service';
import { BoardFormStateService } from './board-form-state.service';
import { Task } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';
import { TaskService } from '../../shared/services/task.service';
/**
 * Main orchestrator service for board form functionality.
 * Coordinates all specialized board form services and provides unified interface.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })

export class BoardFormService {
  private _isCategoryDropdownOpen: boolean = false;
  
  /** Constructor initializes form builder and services */
  constructor(
    private fb: FormBuilder,
    public validationService: BoardFormValidationService,
    public overlayService: BoardFormOverlayService,
    public contactSelectionService: BoardFormContactSelectionService,
    public dataService: BoardFormDataService,
    private taskService: TaskService,
    public taskOperations: BoardFormTaskOperationsService,
    public formState: BoardFormStateService
  ) {}

  /** Gets the task form from form state service */
  get taskForm(): FormGroup {
    return this.formState.getTaskForm();
  }

  /**
   * Initializes form for creating a new task.
   * 
   * @param status - Initial task status
   */
  initializeNewTask(status: 'todo' | 'inprogress' | 'awaiting' | 'done' = 'todo'): void {
    const newTask = this.dataService.createNewTask(status);
    this.resetForm();
    this.overlayService.openAddTaskOverlay(status);
  }

  /**
   * Initializes form for editing an existing task.
   * 
   * @param task - Task to edit
   * @param allContacts - Array of all available contacts
   */
  initializeEditTask(task: Task, allContacts: Contact[] = []): void {
    this.dataService.initializeForEdit(task);
    this.formState.populateFormWithTask(task);
    this.contactSelectionService.setSelectedContactsByNames(task.assignedTo || [], allContacts);
    this.overlayService.openTaskEditOverlay(task);
  }  /**
   * Saves the current task.
   * 
   * @returns Promise<boolean> - Success status
   */
  async saveTask(): Promise<boolean> {
    if (!this.validateForm()) {
      return false;
    }
    try {
      const task = this.buildTaskFromForm();
      if (this.dataService.getIsEditMode()) {
        await this.updateTask(task);
      } else {
        await this.createTask(task);
      }
      this.dataService.saveChanges();
      this.closeForm();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Builds task object from form data.
   * 
   * @returns Task object
   */
  private buildTaskFromForm(): Task {
    const formValue = this.taskForm.value;
    const currentTask = this.getOrCreateCurrentTask();
    const selectedContactNames = this.contactSelectionService.selectedContacts.map(contact => contact.name);
    
    return this.taskOperations.mergeTaskWithFormData(currentTask, formValue, selectedContactNames);
  }

  /**
   * Gets existing task or creates a new one if none exists.
   * 
   * @returns Current or newly created task
   * @private
   */
  private getOrCreateCurrentTask(): Task {
    let currentTask = this.dataService.getCurrentTask();
    
    if (!currentTask) {
      currentTask = this.createNewTaskTemplate();
    }
    
    return currentTask;
  }

  /**
   * Creates a new task template with default values.
   * 
   * @returns New task template
   * @private
   */
  private createNewTaskTemplate(): Task {
    const targetColumn = this.overlayService.getCurrentColumn();
    
    return {
      id: this.taskOperations.generateTaskId(),
      title: '',
      description: '',
      assignedTo: [],
      dueDate: '',
      priority: 'medium',
      column: targetColumn,
      subtasks: [],
      category: '',
      createdAt: new Date()
    };
  }

  /**
   * Creates a new task.
   * 
   * @param task - Task to create
   */
  private async createTask(task: Task): Promise<void> {
    await this.taskOperations.createTask(task);
  }

  /**
   * Updates an existing task.
   * 
   * @param task - Task to update
   */
  private async updateTask(task: Task): Promise<void> {
    await this.taskOperations.updateTask(task);
  }

  /**
   * Validates the form using validation service.
   * 
   * @returns True if form is valid
   */
  validateForm(): boolean {
    this.taskForm.markAllAsTouched();
    
    const validation = this.validationService.validateForm(this.taskForm);
    
    if (!validation.isValid) {
      console.warn('❌ Form validation errors:', validation.errors);
      return false;
    }
    return true;
  }

  /**
   * Gets form validation errors.
   * 
   * @returns Array of validation error messages
   */
  getValidationErrors(): string[] {
    const validation = this.validationService.validateForm(this.taskForm);
    return validation.errors;
  }

  /**
   * Resets the form to initial state.
   */
  resetForm(): void {
    this.formState.resetForm();
    this.contactSelectionService.clearSelectedContacts();
  }

  /**
   * Clears all subtasks from the FormArray.
   */
  private clearSubtasks(): void {
    this.formState.clearSubtasks();
  }

  /**
   * Closes the form and resets state.
   */
  closeForm(): void {
    this.resetForm();
    this.dataService.reset();
    this.overlayService.closeAllOverlays();
    this.contactSelectionService.cleanup();
  }

  /**
   * Cancels form editing and reverts changes.
   */
  cancelEdit(): void {
    if (this.dataService.hasChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.dataService.revertChanges();
        this.closeForm();
      }
    } else {
      this.closeForm();
    }
  }

  /** Gets currently selected contacts */
  get selectedContacts(): Contact[] {
    return this.contactSelectionService.selectedContacts;
  }

  /**
   * Checks if contact is selected.
   * 
   * @param contact - Contact to check
   * @returns True if contact is selected
   */
  isContactSelected(contact: Contact): boolean {
    return this.contactSelectionService.isContactSelected(contact);
  }

  /**
   * Gets selected contacts text.
   * 
   * @returns Selected contacts text
   */
  getSelectedContactsText(): string {
    return this.contactSelectionService.getSelectedContactsText();
  }

  /**
   * Toggles contactselection state.
   * @param contact - Contact parameter
   * @param event? - Event? parameter
   */
  toggleContactSelection(contact: Contact, event?: Event): void {
    this.contactSelectionService.toggleContact(contact);
  }

  /**
   * Sets selectedcontactsbynames value.
   * @param contactNames - Contactnames parameter
   * @param allContacts - Allcontacts parameter
   */
  setSelectedContactsByNames(contactNames: string[], allContacts: Contact[]): void {
    this.contactSelectionService.setSelectedContactsByNames(contactNames, allContacts);
  }

  /** Gets dropdown open state */
  get isDropdownOpen(): boolean {
    return this.contactSelectionService.isDropdownOpen;
  }

  /** Sets dropdown open state */
  set isDropdownOpen(value: boolean) {
    this.contactSelectionService.isDropdownOpen = value;
  }

  /**
   * Toggles dropdown state.
   */
  toggleDropdown(): void {
    this.contactSelectionService.toggleDropdown();
  }

  /** Gets assigned contacts dropdown visibility state */
  get showAssignedContactsDropdown(): boolean {
    return this.contactSelectionService.showAssignedContactsDropdown;
  }

  /** Sets assigned contacts dropdown visibility state */
  set showAssignedContactsDropdown(value: boolean) {
    this.contactSelectionService.showAssignedContactsDropdown = value;
  }

  /**
   * Toggles assignedcontactsdropdown state.
   */
  toggleAssignedContactsDropdown(): void {
    this.contactSelectionService.toggleAssignedContactsDropdown();
  }

  /**
   * Gets remaining assigned contacts count.
   * 
   * @returns Number of remaining contacts
   */
  getRemainingAssignedContactsCount(): number {
    const task = this.selectedTask;
    if (!task || !task.assignedTo || task.assignedTo.length <= 4) return 0;
    return task.assignedTo.length - 4;
  }

  /**
   * Gets remaining assigned contacts.
   * 
   * @returns Array of remaining contact names
   */
  getRemainingAssignedContacts(): string[] {
    const task = this.selectedTask;
    if (!task || !task.assignedTo || task.assignedTo.length <= 4) return [];
    return task.assignedTo.slice(4);
  }

  /**
   * Gets displayed assigned contacts.
   * 
   * @returns Array of displayed contacts
   */
  getDisplayedAssignedContacts(): string[] {
    const task = this.selectedTask;
    if (!task || !task.assignedTo) return [];
    return task.assignedTo.slice(0, 4);
  }

  /**
   * Checks if there are more assigned contacts.
   * 
   * @returns True if more contacts exist
   */
  hasMoreAssignedContacts(): boolean {
    const task = this.selectedTask;
    return !!(task && task.assignedTo && task.assignedTo.length > 4);
  }

  /** Gets add task overlay visibility state */
  get showAddTaskOverlay(): boolean {
    return this.overlayService.showAddTaskOverlay;
  }

  /** Gets task details overlay visibility state */
  get showTaskDetailsOverlay(): boolean {
    return this.overlayService.showTaskDetailsOverlay;
  }

  /** Gets currently selected task */
  get selectedTask(): Task | null {
    return this.overlayService.selectedTask;
  }

  /** Gets task editing state */
  get isEditingTask(): boolean {
    return this.overlayService.isEditingTask;
  }

  /**
   * Handles editTask functionality.
   * @param contacts - Contacts parameter
   */
  editTask(contacts: Contact[]): void {
    if (this.selectedTask) {
      this.initializeEditTask(this.selectedTask, contacts);
    }
  }

  /**
   * Handles cancelEditTask functionality.
   */
  cancelEditTask(): void {
    this.cancelEdit();
  }

  /**
   * Handles saveTaskChanges functionality.
   * @param onTaskUpdate? - Ontaskupdate? parameter
   * @returns Promise that resolves when operation completes
   */
  async saveTaskChanges(onTaskUpdate?: () => void): Promise<void> {
    const success = await this.saveTask();
    if (success && onTaskUpdate) {
      onTaskUpdate();
    }
  }

  /**
   * Handles selectCategory functionality.
   * @param category - Category parameter
   */
  selectCategory(category: string): void {
    this.formState.selectCategory(category);
    this._isCategoryDropdownOpen = false;
  }
  /** Gets category dropdown open state */
  get isCategoryDropdownOpen(): boolean {
    return this._isCategoryDropdownOpen;
  }

  /**
   * Toggles categorydropdown state.
   */
  toggleCategoryDropdown(): void {
    this._isCategoryDropdownOpen = !this._isCategoryDropdownOpen;
  }

  /**
   * Closes category dropdown.
   */
  closeCategoryDropdown(): void {
    this._isCategoryDropdownOpen = false;
  }

  /**
   * Gets categorydisplaytext value.
   * @param categoryValue - Category value or form parameter
   * @returns String result
   */
  getCategoryDisplayText(categoryValue: any): string {

    const category = (typeof categoryValue === 'string') ? categoryValue : categoryValue?.get?.('category')?.value;
    return category === 'technical' ? 'Technical Task' : 
           category === 'user-story' ? 'User Story' : 'Select Category';
  }

  /** Gets subtasks form array */
  get subtasksFormArray(): any {
    return this.formState.getSubtasksFormArray();
  }

  /**
   * Creates subtaskgroup.
   * @param title - Title parameter
   * @param completed - Completed parameter
   * @returns FormGroup
   */
  createSubtaskGroup(title: string = '', completed: boolean = false): FormGroup {
    return this.formState.createSubtaskGroup(title, completed);
  }

  /**
   * Adds a new subtask to the form.
   * 
   * @param title - Title of the new subtask
   */
  addNewSubtask(title: string): void {
    this.formState.addNewSubtask(title);
  }

  /**
   * Removes a subtask from the form by index.
   * 
   * @param index - Index of the subtask to remove
   */
  removeSubtaskByIndex(index: number): void {
    this.formState.removeSubtaskByIndex(index);
  }

  /**
   * Handles submit events.
   * @param updateCallback? - Updatecallback? parameter
   * @returns Promise that resolves when operation completes
   */
  async onSubmit(updateCallback?: () => void): Promise<void> {
    console.log('📝 FormService onSubmit called');
    const success = await this.saveTask();
    console.log('💾 SaveTask result:', success);
    if (success && updateCallback) {
      console.log('🔄 Calling updateCallback');
      updateCallback();
    }
    console.log('✅ FormService onSubmit completed');
  }

  /**
   * Toggles subtask state.
   * @param subtaskIndex - Subtaskindex parameter
   * @param updateCallback? - Updatecallback? parameter
   * @returns Promise that resolves when operation completes
   */
  async toggleSubtask(subtaskIndex: number, updateCallback?: () => void): Promise<void> {
    if (this.selectedTask && this.selectedTask.subtasks[subtaskIndex]) {
      this.selectedTask.subtasks[subtaskIndex].completed = !this.selectedTask.subtasks[subtaskIndex].completed;
      if (updateCallback) {
        updateCallback();
      }
    }
  }

  /**
   * Toggles contact selection.
   * 
   * @param contact - Contact to toggle
   */
  toggleContact(contact: Contact): void {
    this.contactSelectionService.toggleContact(contact);
  }

  /**
   * Gets selected contacts.
   * 
   * @returns Array of selected contacts
   */
  getSelectedContacts(): Contact[] {
    return this.contactSelectionService.selectedContacts;
  }

  /**
   * Opens contact dropdown.
   */
  openContactDropdown(): void {
    this.contactSelectionService.openDropdown();
  }

  /**
   * Closes contact dropdown.
   */
  closeContactDropdown(): void {
    this.contactSelectionService.closeDropdown();
  }

  /**
   * Checks if contact dropdown is open.
   * 
   * @returns True if dropdown is open
   */
  isContactDropdownOpen(): boolean {
    return this.contactSelectionService.isDropdownOpen;
  }

  /**
   * Gets current task being edited.
   * 
   * @returns Current task or null
   */
  getCurrentTask(): Task | null {
    return this.dataService.getCurrentTask();
  }

  /**
   * Checks if form is in edit mode.
   * 
   * @returns True if editing existing task
   */
  isEditMode(): boolean {
    return this.dataService.getIsEditMode();
  }

  /**
   * Adds a subtask to current task.
   * 
   * @param title - Subtask title
   */
  addSubtask(title: string): void {
    this.dataService.addSubtask(title);
  }

  /**
   * Removes a subtask from current task.
   * 
   * @param subtaskId - ID of subtask to remove
   */
  removeSubtask(subtaskId: string | number): void {
    const id = typeof subtaskId === 'number' ? subtaskId.toString() : subtaskId;
    this.dataService.removeSubtask(id);
  }

  /**
   * Gets all subtasks for current task.
   * 
   * @returns Array of subtasks
   */
  getSubtasks() {
    return this.dataService.getSubtasks();
  }

  /**
   * Gets basic form validation status.
   * 
   * @returns True if Angular form is valid
   */
  isFormValid(): boolean {
    return this.formState.isFormValid();
  }

  /**
   * Gets Angular form validation errors.
   * 
   * @returns Object with field errors
   */
  getFormErrors(): any {
    return this.formState.getFormErrors();
  }

  /**
   * Cleanup method for destroying the service.
   */
  cleanup(): void {
    this.dataService.cleanup();
    this.contactSelectionService.cleanup();
    this.overlayService.cleanup();
  }

  /**
   * Gets subtask progress percentage.
   * 
   * @returns Progress percentage
   */
  getSubtaskProgress(): number {
    const subtasks = this.selectedTask?.subtasks || [];
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  }

  /**
   * Gets completed subtasks count.
   * 
   * @returns Number of completed subtasks
   */
  getCompletedSubtasksCount(): number {
    return this.selectedTask?.subtasks?.filter(s => s.completed).length || 0;
  }
}

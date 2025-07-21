import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BoardFormValidationService } from './board-form-validation.service';
import { BoardFormOverlayService } from './board-form-overlay-v2.service';
import { BoardFormContactSelectionService } from './board-form-contact-selection.service';
import { BoardFormDataService } from './board-form-data.service';
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
  taskForm: FormGroup;
  private _isCategoryDropdownOpen: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private validationService: BoardFormValidationService,
    private overlayService: BoardFormOverlayService,
    private contactSelectionService: BoardFormContactSelectionService,
    private dataService: BoardFormDataService,
    private taskService: TaskService
  ) {
    this.taskForm = this.createTaskForm();
  }
  
  /**
   * Formats a date to American format (MM/dd/yyyy).
   * 
   * @param date - Date to format
   * @returns Formatted date string
   */
  private formatDateToAmerican(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Creates and initializes the task form.
   * 
   * @returns Configured FormGroup
   */
  private createTaskForm(): FormGroup {
    const today = new Date();
    const todayFormatted = this.formatDateToAmerican(today);
    
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dueDate: [todayFormatted, Validators.required],
      priority: ['medium', Validators.required],
      category: ['', Validators.required],
      subtasks: this.fb.array([])
    });
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
    this.populateFormWithTask(task);
    this.contactSelectionService.setSelectedContactsByNames(task.assignedTo || [], allContacts);
    this.overlayService.openTaskEditOverlay(task);
  }

  /**
   * Populates form with task data.
   * 
   * @param task - Task data to populate
   */
  private populateFormWithTask(task: Task): void {
    const formattedDate = this.processTaskDate(task.dueDate);
    this.patchFormWithTaskData(task, formattedDate);
    this.populateSubtasks(task.subtasks || []);
  }

  /**
   * Processes and formats the task due date.
   * 
   * @param dueDate - Original due date string
   * @returns Formatted date string
   * @private
   */
  private processTaskDate(dueDate: string): string {
    if (!dueDate) return dueDate;
    
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) return dueDate;
    
    return this.formatDateToAmerican(date);
  }

  /**
   * Patches the form with task data and formatted date.
   * 
   * @param task - Task data
   * @param formattedDate - Formatted due date
   * @private
   */
  private patchFormWithTaskData(task: Task, formattedDate: string): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: formattedDate,
      priority: task.priority,
      category: task.category
    });
  }

  /**
   * Populates the subtasks FormArray with task subtasks.
   * 
   * @param subtasks - Array of subtasks to populate
   */
  private populateSubtasks(subtasks: any[]): void {
    const subtasksFormArray = this.subtasksFormArray;
    
    while (subtasksFormArray.length !== 0) {
      subtasksFormArray.removeAt(0);
    }
    
    subtasks.forEach(subtask => {
      const subtaskGroup = this.fb.group({
        title: [subtask.title || ''],
        completed: [subtask.completed || false],
        id: [subtask.id || Date.now().toString()]
      });
      subtasksFormArray.push(subtaskGroup);
    });
  }

  /**
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
    const selectedContactNames = this.extractSelectedContactNames();
    
    return this.mergeTaskWithFormData(currentTask, formValue, selectedContactNames);
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
      id: this.generateTaskId(),
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
   * Extracts selected contact names from contact selection service.
   * 
   * @returns Array of selected contact names
   * @private
   */
  private extractSelectedContactNames(): string[] {
    return this.contactSelectionService.selectedContacts.map(contact => contact.name);
  }

  /**
   * Merges current task with form data and contact names.
   * 
   * @param currentTask - Current task object
   * @param formValue - Form values
   * @param contactNames - Selected contact names
   * @returns Merged task object
   * @private
   */
  private mergeTaskWithFormData(currentTask: Task, formValue: any, contactNames: string[]): Task {
    return {
      ...currentTask,
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
      assignedTo: contactNames,
      subtasks: formValue.subtasks || []
    };
  }

  /**
   * Generates a temporary ID for new tasks.
   * 
   * @returns Generated string ID
   */
  private generateTaskId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Creates a new task.
   * 
   * @param task - Task to create
   */
  private async createTask(task: Task): Promise<void> {
    try {
      const { id, ...taskWithoutId } = task;
      await this.taskService.addTaskToFirebase(taskWithoutId, task.column);
    } catch (error) {

      console.error('❌ Error creating task:', error);
      throw error;
    }
  }

  /**
   * Updates an existing task.
   * 
   * @param task - Task to update
   */
  private async updateTask(task: Task): Promise<void> {
    try {
      await this.taskService.updateTaskInFirebase(task);
    } catch (error) {

      console.error('❌ Error updating task:', error);
      throw error;
    }
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
    this.taskForm.reset();
    const today = new Date();
    const todayFormatted = this.formatDateToAmerican(today);
    this.taskForm.patchValue({
      priority: 'medium',
      category: '',
      dueDate: todayFormatted
    });
    
    this.clearSubtasks();
    
    this.contactSelectionService.clearSelectedContacts();
  }

  /**
   * Clears all subtasks from the FormArray.
   */
  private clearSubtasks(): void {
    const subtasksFormArray = this.subtasksFormArray;
    while (subtasksFormArray.length !== 0) {
      subtasksFormArray.removeAt(0);
    }
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

  /**
   * Checks if fieldinvalid.
   * @param fieldName - Fieldname parameter
   * @returns Boolean result
   */
  isFieldInvalid(fieldName: string): boolean {
    return this.validationService.isFieldInvalid(this.taskForm, fieldName);
  }

  /**
   * Checks if dateinvalid.
   * @param fieldName - Fieldname parameter
   * @param form? - Form? parameter
   * @returns Boolean result
   */
  isDateInvalid(fieldName: string, form?: any): boolean {
    return this.validationService.isDateInvalid(form || this.taskForm, fieldName);
  }

  /**
   * Gets fielderrormessage value.
   * @param fieldName - Fieldname parameter
   * @returns String result
   */
  getFieldErrorMessage(fieldName: string): string {
    return this.validationService.getFieldErrorMessage(this.taskForm, fieldName);
  }

  get selectedContacts(): Contact[] {
    return this.contactSelectionService.selectedContacts;
  }

  /**
   * Gets selectedcontactstext value.
   * @returns String result
   */
  getSelectedContactsText(): string {
    return this.contactSelectionService.getSelectedContactsText();
  }

  /**
   * Checks if contactselected.
   * @param contact - Contact parameter
   * @returns Boolean result
   */
  isContactSelected(contact: Contact): boolean {
    return this.contactSelectionService.isContactSelected(contact);
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

  get isDropdownOpen(): boolean {
    return this.contactSelectionService.isDropdownOpen;
  }

  set isDropdownOpen(value: boolean) {
    this.contactSelectionService.isDropdownOpen = value;
  }

  /**
   * Toggles dropdown state.
   */
  toggleDropdown(): void {
    this.contactSelectionService.toggleDropdown();
  }

  /**
   * Gets displayedassignedcontacts value.
   * @returns String result
   */
  getDisplayedAssignedContacts(): string[] {
    return this.contactSelectionService.getDisplayedAssignedContacts();
  }

  /**
   * Checks if smoreassignedcontacts.
   * @returns Boolean result
   */
  hasMoreAssignedContacts(): boolean {
    return this.contactSelectionService.hasMoreAssignedContacts();
  }

  get showAssignedContactsDropdown(): boolean {
    return this.contactSelectionService.showAssignedContactsDropdown;
  }

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
   * Gets remainingassignedcontactscount value.
   * @returns Numeric result
   */
  getRemainingAssignedContactsCount(): number {
    return this.contactSelectionService.getRemainingAssignedContactsCount();
  }

  /**
   * Gets remainingassignedcontacts value.
   * @returns String result
   */
  getRemainingAssignedContacts(): string[] {
    return this.contactSelectionService.getRemainingAssignedContacts();
  }

  get showAddTaskOverlay(): boolean {
    return this.overlayService.showAddTaskOverlay;
  }

  get showTaskDetailsOverlay(): boolean {
    return this.overlayService.showTaskDetailsOverlay;
  }

  get selectedTask(): Task | null {
    return this.overlayService.selectedTask;
  }

  get isEditingTask(): boolean {
    return this.overlayService.isEditingTask;
  }

  /**
   * Handles openAddTaskOverlay functionality.
   * @param column? - Column? parameter
   */
  openAddTaskOverlay(column?: any): void {
    this.overlayService.openAddTaskOverlay(column);
  }

  /**
   * Handles closeAddTaskOverlay functionality.
   */
  closeAddTaskOverlay(): void {
    this.overlayService.closeAllOverlays();
  }

  /**
   * Handles openTaskDetails functionality.
   * @param task - Task parameter
   */
  openTaskDetails(task: Task): void {
    this.overlayService.openTaskDetailsOverlay(task);
  }

  /**
   * Handles closeTaskDetailsOverlay functionality.
   */
  closeTaskDetailsOverlay(): void {
    this.overlayService.closeAllOverlays();
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

  get selectedPriority(): string {
    return this.taskForm.get('priority')?.value || 'medium';
  }

  /**
   * Handles selectPriority functionality.
   * @param priority - Priority parameter
   */
  selectPriority(priority: string): void {
    this.taskForm.patchValue({ priority });
  }
  /**
   * Handles selectCategory functionality.
   * @param category - Category parameter
   */
  selectCategory(category: string): void {
    this.taskForm.patchValue({ category });

    this.taskForm.get('category')?.markAsTouched();
    this._isCategoryDropdownOpen = false;
  }
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
   * Handles closeCategoryDropdown functionality.
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
    // Handle both form object and direct value
    const category = (typeof categoryValue === 'string') ? categoryValue : categoryValue?.get?.('category')?.value;
    return category === 'technical' ? 'Technical Task' : 
           category === 'user-story' ? 'User Story' : 'Select Category';
  }

  get subtasksFormArray(): any {
    return this.taskForm.get('subtasks');
  }

  /**
   * Creates subtaskgroup.
   * @param title - Title parameter
   * @param completed - Completed parameter
   * @returns FormGroup
   */
  createSubtaskGroup(title: string = '', completed: boolean = false): FormGroup {
    return this.fb.group({
      title: [title],
      completed: [completed],
      id: [Date.now().toString()]
    });
  }

  /**
   * Adds a new subtask to the form.
   * 
   * @param title - Title of the new subtask
   */
  addNewSubtask(title: string): void {
    if (title.trim()) {
      const subtaskGroup = this.createSubtaskGroup(title.trim());
      this.subtasksFormArray.push(subtaskGroup);
    }
  }

  /**
   * Removes a subtask from the form by index.
   * 
   * @param index - Index of the subtask to remove
   */
  removeSubtaskByIndex(index: number): void {
    this.subtasksFormArray.removeAt(index);
  }

  /**
   * Gets subtaskprogress value.
   * @returns Numeric result
   */
  getSubtaskProgress(): number {
    const subtasks = this.selectedTask?.subtasks || [];
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  }

  /**
   * Gets completedsubtaskscount value.
   * @returns Numeric result
   */
  getCompletedSubtasksCount(): number {
    return this.selectedTask?.subtasks?.filter(s => s.completed).length || 0;
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
   * Opens the task form overlay.
   * 
   * @param mode - Overlay mode
   */
  openOverlay(mode: 'create' | 'edit' = 'create'): void {
    if (mode === 'create') {
      this.overlayService.openAddTaskOverlay();
    } else {
      const currentTask = this.getCurrentTask();
      if (currentTask) {
        this.overlayService.openTaskEditOverlay(currentTask);
      }
    }
  }

  /**
   * Closes the task form overlay.
   */
  closeOverlay(): void {
    this.overlayService.closeAllOverlays();
  }

  /**
   * Checks if overlay is open.
   * 
   * @returns True if overlay is open
   */
  isOverlayOpen(): boolean {
    return this.overlayService.isAnyOverlayOpen();
  }

  /**
   * Gets current overlay mode.
   * 
   * @returns Current overlay mode
   */
  getOverlayMode(): 'create' | 'edit' | null {
    if (this.overlayService.showAddTaskOverlay) return 'create';
    if (this.overlayService.showTaskEditOverlay) return 'edit';
    return null;
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
    return this.taskForm.valid;
  }

  /**
   * Gets Angular form validation errors.
   * 
   * @returns Object with field errors
   */
  getFormErrors(): any {
    return this.taskForm.errors;
  }

  /**
   * Cleanup method for destroying the service.
   */
  cleanup(): void {
    this.dataService.cleanup();
    this.contactSelectionService.cleanup();
    this.overlayService.cleanup();
  }
}

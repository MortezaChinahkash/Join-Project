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
  // Form state
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
      description: ['', [Validators.required, Validators.minLength(10)]],
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
    this.overlayService.openAddTaskOverlay();
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
    // Format the date if it exists
    let formattedDate = task.dueDate;
    if (task.dueDate) {
      // If the date is in a different format, convert it to MM/dd/yyyy
      const date = new Date(task.dueDate);
      if (!isNaN(date.getTime())) {
        formattedDate = this.formatDateToAmerican(date);
      }
    }

    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: formattedDate,
      priority: task.priority,
      category: task.category
    });
    
    // Populate subtasks
    this.populateSubtasks(task.subtasks || []);
  }

  /**
   * Populates the subtasks FormArray with task subtasks.
   * 
   * @param subtasks - Array of subtasks to populate
   */
  private populateSubtasks(subtasks: any[]): void {
    const subtasksFormArray = this.subtasksFormArray;
    
    // Clear existing subtasks
    while (subtasksFormArray.length !== 0) {
      subtasksFormArray.removeAt(0);
    }
    
    // Add each subtask to the FormArray
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
        // Update existing task
        await this.updateTask(task);
      } else {
        // Create new task
        await this.createTask(task);
      }
      
      this.dataService.saveChanges();
      this.closeForm();
      return true;
    } catch (error) {

      console.error('❌ Error saving task:', error);
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
    let currentTask = this.dataService.getCurrentTask();
    
    // If no current task exists (e.g., when creating new task), create a basic task structure
    if (!currentTask) {
      // Determine the column - if we're in edit mode, use 'todo' as default, otherwise get from overlay service
      const targetColumn = this.dataService.getIsEditMode() ? 'todo' : 'todo'; // Will enhance this later
      
      currentTask = {
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
    
    // Extract subtasks from FormArray
    const subtasks = formValue.subtasks || [];
    
    // Get selected contact names for assignedTo field
    const selectedContactNames = this.contactSelectionService.selectedContacts.map(contact => contact.name);
    
    return {
      ...currentTask,
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
      assignedTo: selectedContactNames,
      subtasks: subtasks
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
    // Mark all fields as touched to show validation errors
    this.taskForm.markAllAsTouched();
    
    // Pass the FormGroup itself, not the value
    const validation = this.validationService.validateForm(this.taskForm);
    
    if (!validation.isValid) {
      // Handle validation errors - could display them in UI
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
    // Pass the FormGroup itself, not the value
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
    
    // Clear subtasks FormArray
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

  // ============================================================================
  // DELEGATED METHODS TO SPECIALIZED SERVICES
  // ============================================================================
  // Validation Service Delegates
  isFieldInvalid(fieldName: string): boolean {
    return this.validationService.isFieldInvalid(this.taskForm, fieldName);
  }

  isDateInvalid(fieldName: string, form?: any): boolean {
    return this.validationService.isDateInvalid(form || this.taskForm, fieldName);
  }

  getFieldErrorMessage(fieldName: string): string {
    return this.validationService.getFieldErrorMessage(this.taskForm, fieldName);
  }

  // Contact Selection Service Delegates
  get selectedContacts(): Contact[] {
    return this.contactSelectionService.selectedContacts;
  }

  getSelectedContactsText(): string {
    return this.contactSelectionService.getSelectedContactsText();
  }

  isContactSelected(contact: Contact): boolean {
    return this.contactSelectionService.isContactSelected(contact);
  }

  toggleContactSelection(contact: Contact, event?: Event): void {
    this.contactSelectionService.toggleContact(contact);
  }

  setSelectedContactsByNames(contactNames: string[], allContacts: Contact[]): void {
    this.contactSelectionService.setSelectedContactsByNames(contactNames, allContacts);
  }

  get isDropdownOpen(): boolean {
    return this.contactSelectionService.isDropdownOpen;
  }

  set isDropdownOpen(value: boolean) {
    this.contactSelectionService.isDropdownOpen = value;
  }

  toggleDropdown(): void {
    this.contactSelectionService.toggleDropdown();
  }

  getDisplayedAssignedContacts(): string[] {
    return this.contactSelectionService.getDisplayedAssignedContacts();
  }

  hasMoreAssignedContacts(): boolean {
    return this.contactSelectionService.hasMoreAssignedContacts();
  }

  get showAssignedContactsDropdown(): boolean {
    return this.contactSelectionService.showAssignedContactsDropdown;
  }

  set showAssignedContactsDropdown(value: boolean) {
    this.contactSelectionService.showAssignedContactsDropdown = value;
  }

  toggleAssignedContactsDropdown(): void {
    this.contactSelectionService.toggleAssignedContactsDropdown();
  }

  getRemainingAssignedContactsCount(): number {
    return this.contactSelectionService.getRemainingAssignedContactsCount();
  }

  getRemainingAssignedContacts(): string[] {
    return this.contactSelectionService.getRemainingAssignedContacts();
  }

  // Overlay Service Delegates
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

  openAddTaskOverlay(column?: any): void {
    this.overlayService.openAddTaskOverlay(column);
  }

  closeAddTaskOverlay(): void {
    this.overlayService.closeAllOverlays();
  }

  openTaskDetails(task: Task): void {
    this.overlayService.openTaskDetailsOverlay(task);
  }

  closeTaskDetailsOverlay(): void {
    this.overlayService.closeAllOverlays();
  }

  editTask(contacts: Contact[]): void {
    if (this.selectedTask) {
      this.initializeEditTask(this.selectedTask, contacts);
    }
  }

  cancelEditTask(): void {
    this.cancelEdit();
  }

  async saveTaskChanges(onTaskUpdate?: () => void): Promise<void> {
    const success = await this.saveTask();
    if (success && onTaskUpdate) {
      onTaskUpdate();
    }
  }

  // Data Service Delegates - Basic placeholder implementations
  get selectedPriority(): string {
    return this.taskForm.get('priority')?.value || 'medium';
  }

  selectPriority(priority: string): void {
    this.taskForm.patchValue({ priority });
  }
  selectCategory(category: string): void {
    this.taskForm.patchValue({ category });

    this.taskForm.get('category')?.markAsTouched();
    this._isCategoryDropdownOpen = false;
  }
  get isCategoryDropdownOpen(): boolean {
    return this._isCategoryDropdownOpen;
  }

  toggleCategoryDropdown(): void {
    this._isCategoryDropdownOpen = !this._isCategoryDropdownOpen;
  }

  closeCategoryDropdown(): void {
    this._isCategoryDropdownOpen = false;
  }

  getCategoryDisplayText(form: any): string {
    const category = form?.get('category')?.value;
    return category === 'technical' ? 'Technical Task' : 
           category === 'user-story' ? 'User Story' : 'Select Category';
  }

  get subtasksFormArray(): any {
    return this.taskForm.get('subtasks');
  }

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

  getSubtaskProgress(): number {
    const subtasks = this.selectedTask?.subtasks || [];
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  }

  getCompletedSubtasksCount(): number {
    return this.selectedTask?.subtasks?.filter(s => s.completed).length || 0;
  }

  async onSubmit(updateCallback?: () => void): Promise<void> {
    const success = await this.saveTask();
    if (success && updateCallback) {
      updateCallback();
    }
  }

  async toggleSubtask(subtaskIndex: number, updateCallback?: () => void): Promise<void> {
    if (this.selectedTask && this.selectedTask.subtasks[subtaskIndex]) {
      this.selectedTask.subtasks[subtaskIndex].completed = !this.selectedTask.subtasks[subtaskIndex].completed;
      if (updateCallback) {
        updateCallback();
      }
    }
  }

  // Delegation methods for overlay management
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

  // Delegation methods for contact selection
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

  // Delegation methods for data management
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

  // Delegation methods for validation
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

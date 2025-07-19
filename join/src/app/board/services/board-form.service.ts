import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BoardFormValidationService } from './board-form-validation.service';
import { BoardFormOverlayService } from './board-form-overlay-v2.service';
import { BoardFormContactSelectionService } from './board-form-contact-selection.service';
import { BoardFormDataService } from './board-form-data.service';
import { Task } from '../../interfaces/task.interface';
import { Contact } from '../../contacts/services/contact-data.service';
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
    private dataService: BoardFormDataService
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
      dueDate: [todayFormatted],
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
   */
  initializeEditTask(task: Task): void {
    this.dataService.initializeForEdit(task);
    this.populateFormWithTask(task);
    this.contactSelectionService.setSelectedContactsByIds(task.assignedTo, []);
    this.overlayService.openTaskEditOverlay(task);
  }
  /**
   * Populates form with task data.
   * 
   * @param task - Task data to populate
   */
  private populateFormWithTask(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category
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
      console.error('Error saving task:', error);
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
    const currentTask = this.dataService.getCurrentTask();
    if (!currentTask) {
      throw new Error('No current task available');
    }
    return {
      ...currentTask,
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
      assignedTo: this.contactSelectionService.getSelectedContactIds()
    };
  }
  /**
   * Creates a new task.
   * 
   * @param task - Task to create
   */
  private async createTask(task: Task): Promise<void> {
    // Implementation would depend on your backend service
    console.log('Creating task:', task);
  }
  /**
   * Updates an existing task.
   * 
   * @param task - Task to update
   */
  private async updateTask(task: Task): Promise<void> {
    // Implementation would depend on your backend service
    console.log('Updating task:', task);
  }
  /**
   * Validates the form using validation service.
   * 
   * @returns True if form is valid
   */
  validateForm(): boolean {
    const formValue = this.taskForm.value;
    const validation = this.validationService.validateForm(formValue);
    if (!validation.isValid) {
      // Handle validation errors - could display them in UI
      console.warn('Form validation errors:', validation.errors);
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
    const formValue = this.taskForm.value;
    const validation = this.validationService.validateForm(formValue);
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
    this.contactSelectionService.clearSelectedContacts();
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
      this.initializeEditTask(this.selectedTask);
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
  createSubtaskGroup(title: string = ''): any {
    // Basic placeholder implementation
    return { 
      title: title, 
      completed: false,
      id: Date.now().toString()
    };
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

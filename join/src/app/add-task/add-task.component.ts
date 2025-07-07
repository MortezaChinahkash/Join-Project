import { Component, OnInit, OnDestroy, inject, HostListener, Injector, runInInjectionContext } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { ContactsComponent } from '../contacts/contacts.component';
import { Contact } from '../services/contact-data.service';
import { Firestore, collectionData, collection, DocumentData } from '@angular/fire/firestore';
import { Task } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';
import { InlineSvgDirective } from '../inline-svg.directive';
import { BoardFormService } from '../services/board-form.service';
import { AddTaskFormService } from '../services/add-task-form.service';
import { AddTaskContactService } from '../services/add-task-contact.service';

/**
 * Component for adding new tasks to the system.
 * Provides a form interface for creating tasks with various properties.
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
  newSubtaskTitle: string = ''; // New property for subtask input

  // SHOW TASK ADDED NOTIFICATION
  taskAddedNotif: boolean = false;
  taskNotifDelay: number = 1000;
  
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  /**
   * Initializes the component with required services.
   */
  constructor(
    private taskService: TaskService,
    public boardFormService: BoardFormService,
    private formService: AddTaskFormService,
    private contactService: AddTaskContactService,
    private router: Router
  ) {
    this.taskForm = this.formService.createTaskForm();
  }

  /**
   * Component initialization.
   */
  ngOnInit(): void {
    this.initializeComponent();
  }

  /**
   * Component cleanup.
   */
  ngOnDestroy(): void {
    // Cleanup handled automatically
  }

  /**
   * Initializes component data and state.
   */
  private async initializeComponent(): Promise<void> {
    this.setDefaultValues();
    await this.loadContacts();
  }

  /**
   * Sets default form values.
   */
  private setDefaultValues(): void {
    this.selectedPriority = 'medium';
    this.formService.setDefaultValues(this.taskForm);
  }

  /**
   * Loads contacts from Firestore.
   */
  private async loadContacts(): Promise<void> {
    try {
      runInInjectionContext(this.injector, () => {
        const contactsCollection = collection(this.firestore, 'contacts');
        collectionData(contactsCollection, { idField: 'id' }).subscribe(
          (data: DocumentData[]) => {
            this.contacts = this.contactService.processContactsData(data as Contact[]);
          }
        );
      });
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }

  /**
   * Sets task priority.
   */
  setPriority(priority: 'urgent' | 'medium' | 'low'): void {
    this.selectedPriority = priority;
    this.formService.updateFormPriority(this.taskForm, priority);
  }

  /**
   * Toggles contact dropdown.
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Toggles contact selection.
   */
  toggleContactSelection(contact: Contact, event: Event): void {
    event.stopPropagation();
    
    this.selectedContacts = this.contactService.toggleContactSelection(
      contact, 
      this.selectedContacts
    );
    
    this.formService.updateFormAssignedContacts(this.taskForm, this.selectedContacts);
  }

  /**
   * Checks if contact is selected.
   */
  isContactSelected(contact: Contact): boolean {
    return this.contactService.isContactSelected(contact, this.selectedContacts);
  }

  /**
   * Gets contact initials.
   */
  getInitials(name: string): string {
    return ContactsComponent.getInitials(name);
  }

  /**
   * Gets contact color.
   */
  getInitialsColor(name: string): string {
    return ContactsComponent.getInitialsColor(name);
  }

  /**
   * Gets subtasks form array.
   */
  get subtasksFormArray(): FormArray {
    return this.formService.getSubtasksFormArray(this.taskForm);
  }

  /**
   * Adds new subtask (old method - creates empty subtask immediately).
   */
  addSubtask(): void {
    this.formService.addSubtask(this.taskForm);
  }

  /**
   * Adds new subtask from input field (only when Enter is pressed or + clicked).
   */
  addNewSubtask(): void {
    if (this.newSubtaskTitle.trim()) {
      // Create new subtask with the entered title
      const subtaskGroup = this.formService.createSubtaskGroup(this.newSubtaskTitle.trim(), false);
      this.subtasksFormArray.push(subtaskGroup);
      this.newSubtaskTitle = ''; // Clear the input
    }
  }

  /**
   * Removes subtask.
   */
  removeSubtask(index: number): void {
    this.formService.removeSubtask(this.taskForm, index);
  }

  /**
   * Gets selected contacts display text.
   */
  getSelectedContactsText(): string {
    return this.contactService.formatSelectedContactsText(this.selectedContacts);
  }

  /**
   * Handles form submission.
   */
  async onSubmit(): Promise<void> {
    if (!this.formService.canSubmitForm(this.taskForm, this.isSubmitting)) {
      return;
    }

    this.isSubmitting = true;
    
    try {
      const taskData = this.prepareTaskData();
      await this.taskService.addTaskToFirebase(taskData, 'todo');
      this.resetForm();

      this.taskAddedNotif = true;

    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      this.isSubmitting = false;

      setTimeout(() => {
        this.taskAddedNotif = false;
        this.router.navigate(['/board']); 
      }, this.taskNotifDelay); 
    }
  }

  /**
   * Prepares task data from form.
   */
  private prepareTaskData(): Omit<Task, 'id'> {
    const formValue = this.taskForm.value;
    const validSubtasks = this.formService.filterValidSubtasks(formValue.subtasks || []);
    
    return {
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
      assignedTo: this.contactService.extractContactNames(this.selectedContacts),
      column: 'todo',
      subtasks: validSubtasks,
      createdAt: new Date()
    };
  }

  /**
   * Resets form to initial state.
   */
  resetForm(): void {
    this.taskForm.reset();
    this.selectedContacts = [];
    this.isDropdownOpen = false;
    this.formService.clearAllSubtasks(this.taskForm);
    this.setDefaultValues();
  }

  /**
   * Handles document clicks.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isDropdownOpen) {
      const shouldCloseDropdown = !this.contactService.handleDropdownClick(
        event, 
        this.isDropdownOpen
      );
      
      if (shouldCloseDropdown) {
        this.isDropdownOpen = false;
      }
    }
  }

  /**
   * Gets validation error message.
   */
  getErrorMessage(fieldName: string): string {
    return this.formService.getErrorMessage(this.taskForm, fieldName);
  }
}

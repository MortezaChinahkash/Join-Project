import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Contact, ContactsComponent } from '../contacts/contacts.component';
import { Firestore, collectionData, collection, DocumentData } from '@angular/fire/firestore';
import { Task } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';
import { InlineSvgDirective } from '../inline-svg.directive';
import { BoardFormService } from '../services/board-form.service';

/**
 * Component for adding new tasks to the system
 * Provides a form interface for creating tasks with various properties
 * including title, description, due date, priority, category, and assigned contacts
 */
@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule, InlineSvgDirective],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.scss'
})
export class AddTaskComponent implements OnInit {
  taskForm: FormGroup;
  selectedPriority: 'urgent' | 'medium' | 'low' | '' = '';
  contacts: Contact[] = [];
  private firestore = inject(Firestore);
  
  isDropdownOpen = false;
  selectedContacts: Contact[] = [];
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    public boardFormService: BoardFormService
  ) {
    this.taskForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dueDate: ['', Validators.required],
      priority: ['', Validators.required],
      category: ['', Validators.required],
      assignedTo: [[]],
      subtasks: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.loadContacts();
    this.setDefaultValues();
  }

  /**
   * Sets default values for the form - medium priority by default
   */
  private setDefaultValues(): void {
    // Set medium as default priority
    this.selectedPriority = 'medium';
    this.taskForm.patchValue({ priority: 'medium' });
  }

  /**
   * Loads all contacts from Firestore
   */
  async loadContacts(): Promise<void> {
    try {
      const contactsCollection = collection(this.firestore, 'contacts');
      collectionData(contactsCollection, { idField: 'id' }).subscribe(
        (data: DocumentData[]) => {
          this.contacts = (data as Contact[]).sort((a, b) => a.name.localeCompare(b.name));
        }
      );
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }

  /**
   * Sets the priority level for the task
   */
  setPriority(priority: 'urgent' | 'medium' | 'low'): void {
    this.selectedPriority = priority;
    this.taskForm.patchValue({ priority });
  }

  /**
   * Toggles contact selection dropdown
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Toggles contact selection
   */
  toggleContactSelection(contact: Contact, event: Event): void {
    event.stopPropagation();
    
    const index = this.selectedContacts.findIndex(c => c.id === contact.id);
    if (index > -1) {
      this.selectedContacts.splice(index, 1);
    } else {
      this.selectedContacts.push(contact);
    }
    this.taskForm.patchValue({ assignedTo: this.selectedContacts.map(c => c.name) });
  }

  /**
   * Checks if a contact is selected
   */
  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.id === contact.id);
  }

  /**
   * Gets initials from a contact name using the same logic as contacts component
   */
  getInitials(name: string): string {
    return ContactsComponent.getInitials(name);
  }

  /**
   * Gets color for contact avatar using the same logic as contacts component
   */
  getInitialsColor(name: string): string {
    return ContactsComponent.getInitialsColor(name);
  }

  /**
   * Gets the subtasks FormArray
   */
  get subtasksFormArray(): FormArray {
    return this.taskForm.get('subtasks') as FormArray;
  }

  /**
   * Adds a new subtask to the form array
   */
  addSubtask(): void {
    const subtaskGroup = this.formBuilder.group({
      title: [''], // No validators - empty subtasks will be filtered out on submit
      completed: [false]
    });
    this.subtasksFormArray.push(subtaskGroup);
  }

  /**
   * Removes a subtask from the form array
   */
  removeSubtask(index: number): void {
    this.subtasksFormArray.removeAt(index);
  }

  /**
   * Gets selected contacts text for display
   */
  getSelectedContactsText(): string {
    if (this.selectedContacts.length === 0) return '';
    if (this.selectedContacts.length === 1) return this.selectedContacts[0].name;
    if (this.selectedContacts.length === 2) return this.selectedContacts.map(c => c.name).join(' and ');
    return `${this.selectedContacts[0].name} and ${this.selectedContacts.length - 1} others`;
  }

  /**
   * Submits the task form
   */
  async onSubmit(): Promise<void> {
    if (this.taskForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      try {
        const formValue = this.taskForm.value;
        
        // Filter out empty subtasks - only save subtasks with non-empty titles
        const allSubtasks = formValue.subtasks || [];
        const validSubtasks = allSubtasks.filter((subtask: any) => 
          subtask && subtask.title && subtask.title.trim() !== ''
        );
        
        const task: Omit<Task, 'id'> = {
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

        await this.taskService.addTaskToFirebase(task, 'todo');
        this.resetForm();
        
        // Task created successfully
      } catch (error) {
        console.error('Error creating task:', error);
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Resets the form to initial state
   */
  resetForm(): void {
    this.taskForm.reset();
    this.selectedContacts = [];
    this.isDropdownOpen = false;
    
    // Clear all subtasks
    while (this.subtasksFormArray.length !== 0) {
      this.subtasksFormArray.removeAt(0);
    }
    
    // Set default values after reset
    this.setDefaultValues();
  }

  /**
   * Marks all form fields as touched for validation display
   */
  private markFormGroupTouched(): void {
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
   * Gets validation error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.taskForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} is required`;
      }
      if (control.errors['minlength']) {
        return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact, ContactsComponent } from '../contacts/contacts.component';
import { Firestore, collectionData, collection, DocumentData } from '@angular/fire/firestore';
import { Task } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';
import { InlineSvgDirective } from '../inline-svg.directive';

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
    private taskService: TaskService
  ) {
    this.taskForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dueDate: ['', Validators.required],
      priority: ['', Validators.required],
      category: ['', Validators.required],
      assignedTo: [[]]
    });
  }

  ngOnInit(): void {
    this.loadContacts();
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
    this.taskForm.patchValue({ assignedTo: this.selectedContacts.map(c => c.id || '') });
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
        const task: Omit<Task, 'id'> = {
          title: formValue.title,
          description: formValue.description,
          dueDate: formValue.dueDate,
          priority: formValue.priority,
          category: formValue.category,
          assignedTo: this.selectedContacts.map(c => c.id || ''),
          column: 'todo',
          subtasks: [],
          createdAt: new Date()
        };

        await this.taskService.addTaskToFirebase(task, 'todo');
        this.resetForm();
        
        // Show success message or redirect
        console.log('Task created successfully!');
        
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
    this.selectedPriority = '';
    this.selectedContacts = [];
    this.isDropdownOpen = false;
  }

  /**
   * Marks all form fields as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Opens the date picker when calendar icon is clicked
   */
  openDatePicker(): void {
    const dateInput = document.getElementById('dueDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.showPicker();
    }
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

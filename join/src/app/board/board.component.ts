import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact, ContactsComponent } from '../contacts/contacts.component';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-board',
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit {
  taskForm: FormGroup;
  showAddTaskOverlay = false;
  selectedPriority: 'urgent' | 'medium' | 'low' | '' = '';
  currentColumn: TaskColumn = 'todo'; // Speichert die aktuelle Spalte

  contacts: Contact[] = [];
  private firestore = inject(Firestore);

    isDropdownOpen = false;
    selectedContacts: Contact[] = []; // Array für ausgewählte Kontakte

  
  // Arrays für die verschiedenen Spalten - jetzt typisiert
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  awaitingFeedbackTasks: Task[] = [];
  doneTasks: Task[] = [];

  constructor(private fb: FormBuilder, private taskService: TaskService) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      priority: [''], // Priority ist optional, wird über Buttons gesetzt
      assignedTo: [''],
      category: ['', Validators.required]
    });

    // Lokale Arrays initialisieren
    this.updateLocalArrays();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

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
    
    console.log('Ausgewählte Kontakte:', this.selectedContacts);
  }

  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.id === contact.id);
  }

   selectContact(contact: Contact) {
    this.taskForm.patchValue({ assignedTo: contact.id });
    this.isDropdownOpen = false;
  }
  
  getSelectedContact(): Contact | null {
    const selectedId = this.taskForm.get('assignedTo')?.value;
    if (!selectedId) return null;
    return this.contacts.find(c => c.id === selectedId) || null;
  }

  openAddTaskOverlay(column: TaskColumn = 'todo') {
    this.showAddTaskOverlay = true;
    this.currentColumn = column;
    this.resetForm();
  }

  closeAddTaskOverlay() {
    this.showAddTaskOverlay = false;
    this.resetForm();
  }

  selectPriority(priority: 'urgent' | 'medium' | 'low') {
    this.selectedPriority = priority;
    this.taskForm.patchValue({ priority: priority });
    // Mark priority field as touched to trigger validation
    this.taskForm.get('priority')?.markAsTouched();
  }

  onCategoryChange(event?: Event) {
    // Mark category field as touched when changed
    this.taskForm.get('category')?.markAsTouched();
    
    // Force update validation status
    this.taskForm.get('category')?.updateValueAndValidity();
  }

  resetForm() {
    this.taskForm.reset();
    this.selectedPriority = '';
  }

  onSubmit() {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched();
    
    if (this.taskForm.valid) {
      const taskData: Omit<Task, 'id' | 'createdAt'> = {
        title: this.taskForm.value.title,
        description: this.taskForm.value.description,
        dueDate: this.taskForm.value.dueDate,
        priority: this.selectedPriority,
        assignedTo: this.taskForm.value.assignedTo,
        category: this.taskForm.value.category,
        subtasks: []
      };

      // Task über den Service hinzufügen
      const newTask = this.taskService.addTask(taskData, this.currentColumn);

      // Lokale Arrays aktualisieren
      this.updateLocalArrays();

      console.log('Task created in column:', this.currentColumn);
      console.log('Task:', newTask);
      console.log('All tasks:', this.taskService.getAllTasks());

      this.closeAddTaskOverlay();
    } else {
      console.log('Form is invalid:', this.taskForm.errors);
      console.log('Form values:', this.taskForm.value);
      console.log('Category field:', this.taskForm.get('category'));
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  // Lokale Arrays mit Service synchronisieren
  private updateLocalArrays() {
    this.todoTasks = this.taskService.getTasksByColumn('todo');
    this.inProgressTasks = this.taskService.getTasksByColumn('inprogress');
    this.awaitingFeedbackTasks = this.taskService.getTasksByColumn('awaiting');
    this.doneTasks = this.taskService.getTasksByColumn('done');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Debug method to check category status
  debugCategoryStatus() {
    const categoryField = this.taskForm.get('category');
    console.log('Category field status:', {
      value: categoryField?.value,
      valid: categoryField?.valid,
      invalid: categoryField?.invalid,
      touched: categoryField?.touched,
      errors: categoryField?.errors
    });
  }

  // Helper methods for task display
  getTaskProgress(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(subtask => subtask.completed).length;
    return (completed / task.subtasks.length) * 100;
  }

  getCompletedSubtasks(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter(subtask => subtask.completed).length;
  }

  getAvatarColor(assignedTo: string): string {
    if (!assignedTo) return '#999999';
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#A55EEA', '#FF9FF3', '#26D0CE'];
    const index = assignedTo.charCodeAt(0) % colors.length;
    return colors[index];
  }

  // getInitials(name: string): string {
  //   if (!name) return '';
  //   return name.split(' ').map(n => n[0]).join('').toUpperCase();
  // }

  getPriorityIcon(priority: Task['priority']): string {
    switch (priority) {
      case 'urgent':
        return './assets/img/icon_priority_urgent.svg';
      case 'medium':
        return './assets/img/icon_priority_medium.svg';
      case 'low':
        return './assets/img/icon_priority_low.svg';
      default:
        return './assets/img/icon_priority_medium.svg';
    }
  }

  ngOnInit() {
  console.log('BoardComponent initialized');
  this.loadContacts()
  }

  getInitials(name: string): string {
    return ContactsComponent.getInitials(name);
  }

  getInitialsColor(name: string): string {
    return ContactsComponent.getInitialsColor(name);
  }

  private loadContacts() {
  const contactsCollection = collection(this.firestore, 'contacts');
  collectionData(contactsCollection, { idField: 'id' }).subscribe(
    (contacts) => {
      this.contacts = contacts as Contact[];
      
      // Alphabetisch sortieren
      this.contacts.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      
      console.log('Kontakte geladen:', this.contacts);
    },
    (error) => {
      console.error('Fehler beim Laden der Kontakte:', error);
    }
  );
}

}

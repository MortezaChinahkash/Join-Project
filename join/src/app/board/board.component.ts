import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-board',
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent {
  taskForm: FormGroup;
  showAddTaskOverlay = false;
  selectedPriority: string = '';
  currentColumn: string = ''; // Speichert die aktuelle Spalte

  // Arrays für die verschiedenen Spalten
  todoTasks: any[] = [];
  inProgressTasks: any[] = [];
  awaitingFeedbackTasks: any[] = [];
  doneTasks: any[] = [];

  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      priority: [''], // Priority ist optional, wird über Buttons gesetzt
      assignedTo: [''],
      category: ['', Validators.required]
    });
  }

  openAddTaskOverlay(column: string = 'todo') {
    this.showAddTaskOverlay = true;
    this.currentColumn = column;
    this.resetForm();
  }

  closeAddTaskOverlay() {
    this.showAddTaskOverlay = false;
    this.resetForm();
  }

  selectPriority(priority: string) {
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
      const newTask = {
        id: Date.now(), // Einfache ID-Generierung
        ...this.taskForm.value,
        priority: this.selectedPriority,
        createdAt: new Date(),
        subtasks: [] // Placeholder für Subtasks
      };

      // Task je nach aktueller Spalte zum entsprechenden Array hinzufügen
      switch (this.currentColumn) {
        case 'todo':
          this.todoTasks.push(newTask);
          break;
        case 'inprogress':
          this.inProgressTasks.push(newTask);
          break;
        case 'awaiting':
          this.awaitingFeedbackTasks.push(newTask);
          break;
        case 'done':
          this.doneTasks.push(newTask);
          break;
        default:
          this.todoTasks.push(newTask); // Standard: To Do
      }

      console.log('Task created in column:', this.currentColumn);
      console.log('Task:', newTask);
      console.log('All tasks:', {
        todo: this.todoTasks,
        inProgress: this.inProgressTasks,
        awaiting: this.awaitingFeedbackTasks,
        done: this.doneTasks
      });

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
  getTaskProgress(task: any): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter((subtask: any) => subtask.completed).length;
    return (completed / task.subtasks.length) * 100;
  }

  getCompletedSubtasks(task: any): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter((subtask: any) => subtask.completed).length;
  }

  getAvatarColor(assignedTo: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#A55EEA', '#FF9FF3', '#26D0CE'];
    const index = assignedTo ? assignedTo.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'urgent':
        return './assets/icons/priority_urgent.svg';
      case 'medium':
        return './assets/icons/priority_medium.svg';
      case 'low':
        return './assets/icons/priority_low.svg';
      default:
        return './assets/icons/priority_medium.svg';
    }
  }
}

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

  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      priority: ['', Validators.required],
      assignedTo: [''],
      category: ['', Validators.required]
    });
  }

  openAddTaskOverlay() {
    this.showAddTaskOverlay = true;
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

  onCategoryChange() {
    // Mark category field as touched when changed
    this.taskForm.get('category')?.markAsTouched();
  }

  resetForm() {
    this.taskForm.reset();
    this.selectedPriority = '';
  }

  onSubmit() {
    if (this.taskForm.valid) {
      console.log('Task created:', this.taskForm.value);
      this.closeAddTaskOverlay();
    } else {
      this.markFormGroupTouched();
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
}

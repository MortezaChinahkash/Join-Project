import { Injectable } from '@angular/core';
import { BoardFormStateService } from './board-form-state.service';

/**
 * Service for managing category-related functionality in board forms.
 * Handles category selection, display, and dropdown operations.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardFormCategoryService {
  private _isCategoryDropdownOpen: boolean = false;

  /**
   * Initializes the form category service with required dependencies.
   * 
   * @param formState - Service for managing form state
   */
  constructor(
    private formState: BoardFormStateService
  ) {}

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
}

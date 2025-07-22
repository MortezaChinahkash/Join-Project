import { Directive, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Instance } from 'flatpickr/dist/types/instance';
/**
 * Flatpickr directive for Angular form integration
 */
@Directive({
  selector: '[flatpickr]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FlatpickrDirective),
      multi: true
    }
  ]
})
export class FlatpickrDirective implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() options: any = {};

  @Output() dateChange = new EventEmitter<Date | null>();
  private flatpickrInstance: Instance | null = null;
  private onChange = (value: any) => {};

  private onTouched = () => {};

  /**
   * Constructor initializes Flatpickr directive with element reference
   */
  constructor(private elementRef: ElementRef) {}

  /**
   * Angular lifecycle hook - initializes the directive.
   */
  ngOnInit(): void {
    this.initializeFlatpickr();
    this.setupIconClick();
  }

  /**
   * Angular lifecycle hook - cleans up the flatpickr instance.
   */
  ngOnDestroy(): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }

  /**
   * Initializes the flatpickr instance with default and custom options.
   */
  private initializeFlatpickr(): void {
    const defaultOptions = this.createDefaultOptions();
    const mergedOptions = this.mergeOptionsWithDefaults(defaultOptions);
    this.createFlatpickrInstance(mergedOptions);
  }

  /**
   * Creates default options for flatpickr configuration.
   * 
   * @returns Default options object
   * @private
   */
  private createDefaultOptions(): any {
    return {
      dateFormat: 'm/d/Y',
      allowInput: true,
      minDate: 'today',
      locale: {
        firstDayOfWeek: 0
      },
      onChange: this.createOnChangeHandler(),
      onClose: this.createOnCloseHandler()
    };
  }

  /**
   * Creates the onChange event handler for flatpickr.
   * 
   * @returns onChange handler function
   * @private
   */
  private createOnChangeHandler(): (selectedDates: Date[]) => void {
    return (selectedDates: Date[]) => {
      const date = selectedDates.length > 0 ? selectedDates[0] : null;
      this.onChange(date ? this.formatDate(date) : '');
      this.dateChange.emit(date);
    };
  }

  /**
   * Creates the onClose event handler for flatpickr.
   * 
   * @returns onClose handler function
   * @private
   */
  private createOnCloseHandler(): () => void {
    return () => {
      this.onTouched();
    };
  }

  /**
   * Merges custom options with default options.
   * 
   * @param defaultOptions - Default flatpickr options
   * @returns Merged options object
   * @private
   */
  private mergeOptionsWithDefaults(defaultOptions: any): any {
    return { ...defaultOptions, ...this.options };
  }

  /**
   * Creates the flatpickr instance with merged options.
   * 
   * @param mergedOptions - Final options for flatpickr
   * @private
   */
  private createFlatpickrInstance(mergedOptions: any): void {
    this.flatpickrInstance = flatpickr(this.elementRef.nativeElement, mergedOptions);
  }

  /**
   * Formats a date object to mm/dd/yyyy string format (American format).
   * @param date - The date to format
   * @returns The formatted date string
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
  }

  /**
   * Sets up click handler for the calendar icon to open the date picker.
   */
  private setupIconClick(): void {
    setTimeout(() => {
      this.findAndAttachIconClickHandler();
    }, 0);
  }

  /**
   * Finds the calendar icon and attaches click handler.
   * 
   * @private
   */
  private findAndAttachIconClickHandler(): void {
    const wrapper = this.getElementWrapper();
    if (wrapper) {
      const calendarIcon = this.findCalendarIcon(wrapper);
      if (calendarIcon) {
        this.attachClickHandler(calendarIcon);
      }
    }
  }

  /**
   * Gets the wrapper element containing the calendar icon.
   * 
   * @returns Parent element or null
   * @private
   */
  private getElementWrapper(): Element | null {
    return this.elementRef.nativeElement.parentElement;
  }

  /**
   * Finds the calendar icon within the wrapper element.
   * 
   * @param wrapper - Wrapper element to search in
   * @returns Calendar icon element or null
   * @private
   */
  private findCalendarIcon(wrapper: Element): Element | null {
    return wrapper.querySelector('.date-icon');
  }

  /**
   * Attaches click handler to the calendar icon.
   * 
   * @param calendarIcon - Calendar icon element
   * @private
   */
  private attachClickHandler(calendarIcon: Element): void {
    calendarIcon.addEventListener('click', () => {
      if (this.flatpickrInstance) {
        this.flatpickrInstance.open();
      }
    });
  }

  /**
   * ControlValueAccessor implementation - writes a value to the form control.
   * @param value - The value to set in the date picker
   */
  writeValue(value: any): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.setDate(value || '', false);
    }
  }

  /**
   * ControlValueAccessor implementation - registers the onChange callback.
   * @param fn - The callback function to register
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * ControlValueAccessor implementation - registers the onTouched callback.
   * @param fn - The callback function to register
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * ControlValueAccessor implementation - sets the disabled state of the control.
   * @param isDisabled - Whether the control should be disabled
   */
  setDisabledState(isDisabled: boolean): void {
    if (this.flatpickrInstance) {
      if (isDisabled) {
        this.flatpickrInstance.set('clickOpens', false);
      } else {
        this.flatpickrInstance.set('clickOpens', true);
      }
    }
  }
}

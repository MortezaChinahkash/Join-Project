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

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.initializeFlatpickr();
    this.setupIconClick();
  }

  ngOnDestroy(): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }

  private initializeFlatpickr(): void {
    const defaultOptions = {
      dateFormat: 'd.m.Y',
      allowInput: true,
      minDate: 'today',
      locale: {
        firstDayOfWeek: 1 // Monday
      },
      onChange: (selectedDates: Date[]) => {
        const date = selectedDates.length > 0 ? selectedDates[0] : null;
        this.onChange(date ? this.formatDate(date) : '');
        this.dateChange.emit(date);
      },
      onClose: () => {
        this.onTouched();
      }
    };

    const mergedOptions = { ...defaultOptions, ...this.options };
    
    this.flatpickrInstance = flatpickr(this.elementRef.nativeElement, mergedOptions);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}.${month}.${year}`;
  }

  private setupIconClick(): void {
    // Find the calendar icon in the same wrapper and make it clickable
    setTimeout(() => {
      const wrapper = this.elementRef.nativeElement.parentElement;
      if (wrapper) {
        const calendarIcon = wrapper.querySelector('.date-icon');
        if (calendarIcon) {
          calendarIcon.addEventListener('click', () => {
            if (this.flatpickrInstance) {
              this.flatpickrInstance.open();
            }
          });
        }
      }
    }, 0);
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.setDate(value || '', false);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

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

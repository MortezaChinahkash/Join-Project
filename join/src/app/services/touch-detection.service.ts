import { Injectable } from '@angular/core';

/**
 * Service for detecting touch device capabilities.
 * Handles touch device detection for mobile features.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class TouchDetectionService {
  private _isTouchDevice: boolean | null = null;

  /**
   * Detects if the current device supports touch input.
   * Uses multiple detection methods for better accuracy.
   * 
   * @returns True if device supports touch input
   */
  isTouchDevice(): boolean {
    if (this._isTouchDevice !== null) {
      return this._isTouchDevice;
    }

    // Check for touch support using multiple methods
    const hasTouchSupport = (
      // Modern browsers
      ('ontouchstart' in window) ||
      // IE10/11 and modern browsers
      (navigator.maxTouchPoints > 0) ||
      // Check for touch events in window
      ('TouchEvent' in window)
    );

    // Additional check for pointer events (modern touch devices)
    const hasPointerSupport = 'PointerEvent' in window && navigator.maxTouchPoints > 0;

    // Combine both checks
    this._isTouchDevice = hasTouchSupport || hasPointerSupport;
    
    return this._isTouchDevice;
  }

  /**
   * Checks if device is mobile based on screen size and touch capability.
   * 
   * @returns True if device is considered mobile
   */
  isMobileDevice(): boolean {
    const screenWidth = window.innerWidth;
    const isTouchCapable = this.isTouchDevice();
    
    // Consider it mobile if screen is small OR if it's a touch device with medium screen
    return screenWidth <= 1000 || (isTouchCapable && screenWidth <= 1200);
  }

  /**
   * Checks if mobile move buttons should be shown.
   * Shows on small screens or touch devices.
   * 
   * @returns True if mobile move buttons should be displayed
   */
  shouldShowMobileControls(): boolean {
    return this.isMobileDevice() || this.isTouchDevice();
  }

  /**
   * Forces a re-detection of touch capabilities.
   * Useful for dynamic changes or testing.
   */
  resetDetection(): void {
    this._isTouchDevice = null;
  }
}

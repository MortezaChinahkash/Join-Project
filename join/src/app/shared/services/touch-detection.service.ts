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
    const hasTouchSupport = (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      ('TouchEvent' in window)
    );
    const hasPointerSupport = 'PointerEvent' in window && navigator.maxTouchPoints > 0;
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
    return screenWidth <= 1000 || (isTouchCapable && screenWidth <= 1200);
  }

  /**
   * Checks if mobile move buttons should be shown.
   * Since CSS media queries handle the main visibility logic,
   * this is mainly used for Angular template control.
   * 
   * @returns True if mobile move buttons should be displayed
   */
  shouldShowMobileControls(): boolean {
    return this.isTouchDevice();
  }

  /**
   * Forces a re-detection of touch capabilities.
   * Useful for dynamic changes or testing.
   */
  resetDetection(): void {
    this._isTouchDevice = null;
  }

  /**
   * Determines if this is a primary touch device (mobile/tablet) vs desktop with touchscreen.
   * Uses screen size and device characteristics to make the distinction.
   * 
   * @returns True if this is a primary touch device
   */
  isPrimaryTouchDevice(): boolean {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isTouchCapable = this.isTouchDevice();
    if (!isTouchCapable) {
      return false;
    }
    if (screenWidth <= 768) {
      return true;
    }
    if (screenWidth <= 1200 && isTouchCapable) {
      return true;
    }
    return false;
  }
}

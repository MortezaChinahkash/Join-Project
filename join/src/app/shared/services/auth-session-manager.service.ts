import { Injectable } from '@angular/core';
import { User } from './auth.service';

/**
 * Service for handling session management and monitoring.
 * Manages session timing, validation, and cleanup.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthSessionManagerService {
  private sessionCheckInterval: any;

  /**
   * Starts periodic session check to auto-logout after specified duration.
   * @param checkCallback - Function to call on each session check
   * @param intervalMinutes - Check interval in minutes (default: 5)
   */
  startSessionCheck(checkCallback: () => void, intervalMinutes: number = 5): void {
    this.sessionCheckInterval = setInterval(() => {
      checkCallback();
    }, intervalMinutes * 60 * 1000);
    checkCallback();
  }

  /**
   * Checks if current session has expired and returns true if expired.
   * @param currentUser - Current user object
   * @param sessionDuration - Session duration in milliseconds
   * @returns True if session is expired
   */
  isSessionExpired(currentUser: User | null, sessionDuration: number): boolean {
    if (!currentUser) return false;
    const currentTime = Date.now();
    const sessionAge = currentTime - currentUser.loginTimestamp;
    return sessionAge > sessionDuration;
  }

  /**
   * Stops the session check interval.
   */
  stopSessionCheck(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Clears expired session data from local storage.
   * @param storageKey - The localStorage key to clear
   */
  clearExpiredSession(storageKey: string): void {
    localStorage.removeItem(storageKey);
  }

  /**
   * Saves user to local storage.
   * @param user - User object to save
   * @param storageKey - The localStorage key to use
   */
  saveUserToStorage(user: User, storageKey: string): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(user));
    } catch (error) {
      // Silent error handling for storage issues
    }
  }

  /**
   * Loads user from local storage on app initialization.
   * @param storageKey - The localStorage key to read from
   * @returns Parsed user object or null
   */
  loadUserFromStorage(storageKey: string): any {
    try {
      const userData = localStorage.getItem(storageKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      localStorage.removeItem(storageKey);
      return null;
    }
  }
}

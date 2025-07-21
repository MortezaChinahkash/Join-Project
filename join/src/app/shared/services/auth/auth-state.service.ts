import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
export interface User {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  loginTimestamp: number; // Timestamp when user logged in
}

/**
 * Service for managing user state and local storage operations.
 * Handles user data persistence and state management.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly STORAGE_KEY = 'join_user';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  /**
   * Gets the current user value.
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Checks if user is currently authenticated.
   */
  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Checks if current user is a guest.
   */
  get isGuest(): boolean {
    return this.currentUser?.isGuest === true;
  }

  /**
   * Sets the current user and updates observers.
   * 
   * @param user - User to set as current
   */
  setCurrentUser(user: User | null): void {
    this.currentUserSubject.next(user);
    if (user) {
      this.saveUserToStorage(user);
    } else {
      this.clearUserFromStorage();
    }
  }

  /**
   * Loads user from local storage if session is still valid.
   */
  loadUserFromStorage(): void {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEY);
      if (userData) {
        const user: User = JSON.parse(userData);
        // Check if session is still valid
        const sessionAge = Date.now() - user.loginTimestamp;
        if (sessionAge > this.SESSION_DURATION) {
          // Session expired, clear storage
          localStorage.removeItem(this.STORAGE_KEY);
          return;
        }
        // Update current user if no user is set
        if (!this.currentUserSubject.value) {
          this.currentUserSubject.next(user);
        }
      }
    } catch (error) {

      console.error('Error loading user from storage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Saves user data to local storage.
   * 
   * @param user - User to save
   * @private
   */
  private saveUserToStorage(user: User): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (error) {

      console.error('Error saving user to storage:', error);
    }
  }

  /**
   * Clears user data from local storage.
   * @private
   */
  private clearUserFromStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Formats session duration for display.
   * 
   * @param durationMs - Duration in milliseconds
   * @returns Formatted duration string
   */
  formatSessionDuration(durationMs: number): string {
    const hours = Math.floor(durationMs / (60 * 60 * 1000));
    const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Gets session age in milliseconds.
   * 
   * @returns Session age or 0 if no user
   */
  getSessionAge(): number {
    if (!this.currentUser) return 0;
    return Date.now() - this.currentUser.loginTimestamp;
  }

  /**
   * Checks if current session has expired.
   * 
   * @returns True if session has expired
   */
  isSessionExpired(): boolean {
    const sessionAge = this.getSessionAge();
    return sessionAge > this.SESSION_DURATION;
  }

  /**
   * Gets remaining session time in milliseconds.
   * 
   * @returns Remaining session time
   */
  getRemainingSessionTime(): number {
    const sessionAge = this.getSessionAge();
    return Math.max(0, this.SESSION_DURATION - sessionAge);
  }

  /**
   * Updates user timestamp to extend session.
   */
  extendSession(): void {
    if (this.currentUser) {
      const updatedUser = { ...this.currentUser, loginTimestamp: Date.now() };

      this.setCurrentUser(updatedUser);
    }
  }

  /**
   * Clears all user state and storage.
   */
  clearUserState(): void {
    this.currentUserSubject.next(null);
    this.clearUserFromStorage();
  }
}

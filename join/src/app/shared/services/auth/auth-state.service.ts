import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
export interface User {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  loginTimestamp: number;
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
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000;
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
      const userData = this.getUserDataFromStorage();
      if (userData) {
        this.processStoredUserData(userData);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Retrieves user data from localStorage.
   * @returns Parsed user data or null if not found
   * @private
   */
  private getUserDataFromStorage(): User | null {
    const userData = localStorage.getItem(this.STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Processes stored user data and validates session.
   * @param user - The user data from storage
   * @private
   */
  private processStoredUserData(user: User): void {
    if (this.checkSessionExpiry(user)) {
      localStorage.removeItem(this.STORAGE_KEY);
      return;
    }
    
    if (!this.currentUserSubject.value) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Checks if the stored user session has expired.
   * @param user - The user data to check
   * @returns True if session is expired
   * @private
   */
  private checkSessionExpiry(user: User): boolean {
    const sessionAge = Date.now() - user.loginTimestamp;
    return sessionAge > this.SESSION_DURATION;
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

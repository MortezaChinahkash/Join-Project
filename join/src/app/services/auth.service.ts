import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
}

/**
 * Authentication service for handling user login, registration, and session management.
 * Manages user authentication state and provides methods for login, registration, and logout.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private readonly STORAGE_KEY = 'join_user';

  constructor(private router: Router) {
    this.loadUserFromStorage();
  }

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
   * Authenticates user with email and password.
   * @param email - User's email address
   * @param password - User's password
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // Simulate API call delay
      await this.delay(1000);

      // In a real app, this would be an API call
      // For demo purposes, we'll simulate user validation
      const user = await this.validateUser(email, password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      this.setCurrentUser(user);
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Registers a new user.
   * @param name - User's full name
   * @param email - User's email address
   * @param password - User's password
   */
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      // Simulate API call delay
      await this.delay(1000);

      // Check if user already exists
      const existingUser = await this.checkUserExists(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const newUser: User = {
        id: this.generateUserId(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        isGuest: false
      };

      // In a real app, this would save to database
      await this.saveUser(newUser);
      
      this.setCurrentUser(newUser);
      return newUser;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logs in user as guest.
   */
  async loginAsGuest(): Promise<User> {
    try {
      // Simulate API call delay
      await this.delay(500);

      const guestUser: User = {
        id: 'guest_' + Date.now(),
        name: 'Guest User',
        email: 'guest@join.com',
        isGuest: true
      };

      this.setCurrentUser(guestUser);
      return guestUser;
    } catch (error) {
      throw new Error('Guest login failed');
    }
  }

  /**
   * Logs out the current user.
   */
  async logout(): Promise<void> {
    try {
      // Clear user data
      this.currentUserSubject.next(null);
      localStorage.removeItem(this.STORAGE_KEY);
      
      // Redirect to auth page
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Checks if user is authorized to access protected routes.
   */
  canActivate(): boolean {
    if (this.isAuthenticated) {
      return true;
    }
    
    this.router.navigate(['/auth']);
    return false;
  }

  /**
   * Sets the current user and saves to storage.
   */
  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.saveUserToStorage(user);
  }

  /**
   * Loads user from local storage on app initialization.
   */
  private loadUserFromStorage(): void {
    try {
      const storedUser = localStorage.getItem(this.STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Saves user to local storage.
   */
  private saveUserToStorage(user: User): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  /**
   * Simulates user validation (replace with real API call).
   */
  private async validateUser(email: string, password: string): Promise<User | null> {
    // Demo users for testing
    const demoUsers = [
      {
        id: 'user_1',
        name: 'Demo User',
        email: 'demo@join.com',
        password: 'password123',
        isGuest: false
      },
      {
        id: 'user_2',
        name: 'Test User',
        email: 'test@join.com',
        password: 'test123',
        isGuest: false
      }
    ];

    const user = demoUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isGuest: user.isGuest
      };
    }

    return null;
  }

  /**
   * Checks if user already exists (replace with real API call).
   */
  private async checkUserExists(email: string): Promise<boolean> {
    // In a real app, this would check the database
    const demoUsers = ['demo@join.com', 'test@join.com'];
    return demoUsers.includes(email.toLowerCase());
  }

  /**
   * Saves new user (replace with real API call).
   */
  private async saveUser(user: User): Promise<void> {
    // In a real app, this would save to database
    console.log('User saved:', user);
  }

  /**
   * Generates a unique user ID.
   */
  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Handles authentication errors and returns user-friendly messages.
   */
  private handleAuthError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    
    return new Error('An unexpected error occurred during authentication');
  }

  /**
   * Utility method to simulate async operations.
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets user display name for UI.
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    
    if (this.currentUser.isGuest) {
      return 'Guest';
    }
    
    // Return initials from name
    return this.currentUser.name
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  /**
   * Gets user's full name.
   */
  getUserFullName(): string {
    return this.currentUser?.name || '';
  }

  /**
   * Gets user's email.
   */
  getUserEmail(): string {
    return this.currentUser?.email || '';
  }
}

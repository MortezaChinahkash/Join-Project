import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, signInAnonymously, updateProfile } from '@angular/fire/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
}

/**
 * Authentication service for handling user login, registration, and session management.
 * Manages user authentication state and provides methods for login, registration, and logout.
 * Integrated with Firebase Authentication.
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

  constructor(
    private router: Router,
    private auth: Auth
  ) {
    this.initializeAuthListener();
    this.loadUserFromStorage();
  }

  /**
   * Initializes Firebase auth state listener.
   */
  private initializeAuthListener(): void {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        const user = this.mapFirebaseUserToUser(firebaseUser);
        this.currentUserSubject.next(user);
        this.saveUserToStorage(user);
      } else {
        // Only clear if we're not just starting up
        if (this.currentUserSubject.value) {
          this.currentUserSubject.next(null);
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    });
  }

  /**
   * Waits for Firebase auth to be ready and returns the current auth state.
   */
  async waitForAuthReady(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
        unsubscribe(); // Stop listening after first emission
        if (firebaseUser) {
          const user = this.mapFirebaseUserToUser(firebaseUser);
          this.currentUserSubject.next(user);
          this.saveUserToStorage(user);
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Maps Firebase user to our User interface.
   */
  private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      isGuest: firebaseUser.isAnonymous
    };
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
   * Authenticates user with email and password using Firebase.
   * @param email - User's email address
   * @param password - User's password
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = this.mapFirebaseUserToUser(userCredential.user);
      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Registers a new user with Firebase Authentication.
   * @param name - User's full name
   * @param email - User's email address
   * @param password - User's password
   */
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: name.trim()
      });

      const user = this.mapFirebaseUserToUser(userCredential.user);
      // Update the user object with the correct name
      user.name = name.trim();
      
      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logs in user as guest using Firebase Anonymous Authentication.
   */
  async loginAsGuest(): Promise<User> {
    try {
      const userCredential = await signInAnonymously(this.auth);
      const user = this.mapFirebaseUserToUser(userCredential.user);
      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logs out the current user using Firebase.
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      // Firebase auth state listener will handle clearing the user state
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
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
      const userData = localStorage.getItem(this.STORAGE_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        // Only set user if Firebase hasn't already set one
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
   * Handles authentication errors and returns user-friendly messages.
   */
  private handleAuthError(error: any): Error {
    console.error('Auth error:', error);
    
    // Firebase auth error codes
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return new Error('Invalid email or password');
      case 'auth/email-already-in-use':
        return new Error('An account with this email already exists');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters');
      case 'auth/invalid-email':
        return new Error('Please enter a valid email address');
      case 'auth/operation-not-allowed':
        return new Error('This operation is not allowed');
      case 'auth/too-many-requests':
        return new Error('Too many failed attempts. Please try again later');
      default:
        return new Error('An error occurred during authentication');
    }
  }

  /**
   * Gets user display name for UI.
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    
    if (this.currentUser.isGuest) {
      return 'GU';
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

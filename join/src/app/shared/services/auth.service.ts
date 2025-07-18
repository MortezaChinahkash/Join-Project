import { Injectable, OnDestroy, inject, Injector, runInInjectionContext } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, signInAnonymously, updateProfile } from '@angular/fire/auth';
import { WelcomeOverlayService } from './welcome-overlay.service';

export interface User {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  loginTimestamp: number; // Timestamp when user logged in
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
export class AuthService implements OnDestroy {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private readonly STORAGE_KEY = 'join_user';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private sessionCheckInterval: any;
  private injector = inject(Injector);

  constructor(
    private router: Router,
    private auth: Auth,
    private welcomeOverlayService: WelcomeOverlayService
  ) {
    // Defer Firebase initialization to avoid injection context warnings
    setTimeout(() => {
      this.initializeAuthListener();
      this.loadUserFromStorage();
      this.startSessionCheck();
    }, 0);
  }

  /**
   * Initializes Firebase auth state listener.
   */
  private initializeAuthListener(): void {
    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (firebaseUser) => {
        if (firebaseUser) {
          const user = this.mapFirebaseUserToUser(firebaseUser);
          this.currentUserSubject.next(user);
          this.saveUserToStorage(user);
          // Start session monitoring when user logs in
          this.startSessionCheck();
        } else {
          // Only clear if we're not just starting up
          if (this.currentUserSubject.value) {
            this.currentUserSubject.next(null);
            localStorage.removeItem(this.STORAGE_KEY);
          }
          // Stop session monitoring when user logs out
          this.stopSessionCheck();
        }
      });
    });
  }

  /**
   * Waits for Firebase auth to be ready and returns the current auth state.
   */
  async waitForAuthReady(): Promise<User | null> {
    return new Promise((resolve) => {
      runInInjectionContext(this.injector, () => {
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
      isGuest: firebaseUser.isAnonymous,
      loginTimestamp: Date.now() // Current timestamp
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
      const userCredential = await runInInjectionContext(this.injector, () => 
        signInWithEmailAndPassword(this.auth, email, password)
      );
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
      const userCredential = await runInInjectionContext(this.injector, () => 
        createUserWithEmailAndPassword(this.auth, email, password)
      );
      
      // Update the user's display name
      await runInInjectionContext(this.injector, () => 
        updateProfile(userCredential.user, {
          displayName: name.trim()
        })
      );

      const user = this.mapFirebaseUserToUser(userCredential.user);
      // Update the user object with the correct name
      user.name = name.trim();
      // Set current login timestamp
      user.loginTimestamp = Date.now();
      
      // Mark that this is a new user for onboarding
      localStorage.setItem('join_new_user', 'true');
      
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
      const userCredential = await runInInjectionContext(this.injector, () => 
        signInAnonymously(this.auth)
      );
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
      this.stopSessionCheck(); // Stop session monitoring
      this.welcomeOverlayService.clear(); // Clear overlay flag
      await runInInjectionContext(this.injector, () => 
        signOut(this.auth)
      );
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
        
        // Check if session has expired
        const currentTime = Date.now();
        const sessionAge = currentTime - (user.loginTimestamp || 0);
        
        if (sessionAge > this.SESSION_DURATION) {
          // Session expired, remove from storage
          console.log('Stored session expired, removing from storage');
          localStorage.removeItem(this.STORAGE_KEY);
          return;
        }
        
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
   * Gets remaining session time in milliseconds.
   */
  getRemainingSessionTime(): number {
    const currentUser = this.currentUser;
    if (!currentUser) return 0;
    
    const currentTime = Date.now();
    const sessionAge = currentTime - currentUser.loginTimestamp;
    const remainingTime = this.SESSION_DURATION - sessionAge;
    
    return Math.max(0, remainingTime);
  }

  /**
   * Gets remaining session time formatted as string.
   */
  getRemainingSessionTimeFormatted(): string {
    const remainingMs = this.getRemainingSessionTime();
    if (remainingMs === 0) return '0 hours';
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
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
   * Cleanup method to be called when service is destroyed.
   */
  ngOnDestroy(): void {
    this.stopSessionCheck();
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

  /**
   * Updates the current user's profile in Firebase Auth.
   * @param name - New display name
   */
  async updateUserProfile(name: string): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user found');
    }

    try {
      await runInInjectionContext(this.injector, () => 
        updateProfile(this.auth.currentUser!, {
          displayName: name.trim()
        })
      );

      // Update our local user object
      const currentUser = this.currentUser;
      if (currentUser) {
        currentUser.name = name.trim();
        this.currentUserSubject.next(currentUser);
        this.saveUserToStorage(currentUser);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Starts periodic session check to auto-logout after 24 hours.
   */
  private startSessionCheck(): void {
    // Check every 5 minutes
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionExpiry();
    }, 5 * 60 * 1000);
    
    // Also check immediately
    this.checkSessionExpiry();
  }

  /**
   * Checks if current session has expired and logs out if necessary.
   */
  private checkSessionExpiry(): void {
    const currentUser = this.currentUser;
    if (!currentUser) return;
    
    const currentTime = Date.now();
    const sessionAge = currentTime - currentUser.loginTimestamp;
    
    // If session is older than 24 hours, auto-logout
    if (sessionAge > this.SESSION_DURATION) {
      console.log('Session expired after 24 hours, logging out automatically');
      this.logout();
    }
  }

  /**
   * Stops the session check interval.
   */
  private stopSessionCheck(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}


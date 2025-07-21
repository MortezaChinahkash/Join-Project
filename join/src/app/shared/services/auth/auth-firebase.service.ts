import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInAnonymously, updateProfile, User as FirebaseUser, onAuthStateChanged } from '@angular/fire/auth';
import { User } from './auth-state.service';
/**
 * Service for handling Firebase authentication operations.
 * Manages login, registration, and Firebase auth state.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthFirebaseService {
  private auth = inject(Auth);
  private injector = inject(Injector);
  /**
   * Initializes Firebase auth state listener.
   * 
   * @param onAuthStateChange - Callback for auth state changes
   */
  initializeAuthListener(onAuthStateChange: (user: User | null) => void): void {
    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (firebaseUser) => {
        if (firebaseUser) {
          const user = this.mapFirebaseUserToUser(firebaseUser);
          onAuthStateChange(user);
        } else {
          onAuthStateChange(null);
        }
      });
    });
  }

  /**
   * Waits for Firebase auth to be ready and returns the current auth state.
   * 
   * @returns Promise that resolves with current user or null
   */
  async waitForAuthReady(): Promise<User | null> {
    return new Promise((resolve) => {
      runInInjectionContext(this.injector, () => {
        const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
          unsubscribe();
          if (firebaseUser) {
            const user = this.mapFirebaseUserToUser(firebaseUser);
            resolve(user);
          } else {
            resolve(null);
          }
        });
      });
    });
  }

  /**
   * Authenticates user with email and password using Firebase.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise that resolves with user data
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
   * 
   * @param name - User's full name
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise that resolves with user data
   */
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      const userCredential = await this.createFirebaseUser(email, password);
      await this.setUserDisplayName(userCredential.user, name);
      return this.createRegisteredUser(userCredential.user, name);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Creates a new Firebase user with email and password.
   * @param email - User's email address
   * @param password - User's password
   * @returns Firebase user credential
   * @private
   */
  private async createFirebaseUser(email: string, password: string): Promise<any> {
    return await runInInjectionContext(this.injector, () => 
      createUserWithEmailAndPassword(this.auth, email, password)
    );
  }

  /**
   * Sets the display name for a Firebase user during registration.
   * @param firebaseUser - Firebase user object
   * @param name - User's display name
   * @private
   */
  private async setUserDisplayName(firebaseUser: any, name: string): Promise<void> {
    await runInInjectionContext(this.injector, () => 
      updateProfile(firebaseUser, {
        displayName: name.trim()
      })
    );
  }

  /**
   * Creates a registered user object from Firebase user.
   * @param firebaseUser - Firebase user object
   * @param name - User's display name
   * @returns Registered user object
   * @private
   */
  private createRegisteredUser(firebaseUser: any, name: string): User {
    const user = this.mapFirebaseUserToUser(firebaseUser);
    user.name = name.trim();
    user.loginTimestamp = Date.now();
    localStorage.setItem('join_new_user', 'true');
    return user;
  }

  /**
   * Logs in user as guest using Firebase Anonymous Authentication.
   * 
   * @returns Promise that resolves with guest user data
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
   * 
   * @returns Promise that resolves when logout is complete
   */
  async logout(): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () => signOut(this.auth));
    } catch (error: any) {

      console.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Updates user profile information.
   * 
   * @param updates - Profile updates to apply
   * @returns Promise that resolves when update is complete
   */
  async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }
    try {
      await runInInjectionContext(this.injector, () => 
        updateProfile(currentUser, updates)
      );
    } catch (error: any) {

      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Maps Firebase user to our User interface.
   * 
   * @param firebaseUser - Firebase user object
   * @returns User object with our interface
   * @private
   */
  private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      isGuest: firebaseUser.isAnonymous,
      loginTimestamp: Date.now()
    };
  }

  /**
   * Handles Firebase authentication errors and converts them to user-friendly messages.
   * 
   * @param error - Firebase auth error
   * @returns Error with user-friendly message
   * @private
   */
  private handleAuthError(error: any): Error {
    let message = 'An unexpected error occurred. Please try again.';
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Invalid email or password. Please check your credentials and try again.';
        break;
      case 'auth/invalid-email':
        message = 'The email address is not valid. Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled. Please contact support for assistance.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many unsuccessful attempts. Please try again later.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists. Please use a different email or try logging in.';
        break;
      case 'auth/weak-password':
        message = 'The password is too weak. Please use a stronger password with at least 6 characters.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your internet connection and try again.';
        break;
      case 'auth/invalid-credential':
        message = 'The provided credentials are invalid. Please check your email and password.';
        break;
      default:
        console.error('Firebase Auth Error:', error);
        message = error.message || message;
    }
    return new Error(message);
  }

  /**
   * Gets the current Firebase user.
   * 
   * @returns Current Firebase user or null
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  /**
   * Checks if Firebase auth is ready.
   * 
   * @returns True if auth is ready
   */
  isAuthReady(): boolean {
    return this.auth.currentUser !== undefined;
  }
}

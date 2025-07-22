import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Auth, updateProfile, User as FirebaseUser } from '@angular/fire/auth';
import { User } from './auth.service';

/**
 * Utility service for authentication-related helper functions.
 * Handles error mapping, user profile management, and time formatting.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthUtilsService {
  private injector = inject(Injector);
  private auth = inject(Auth);

  /**
   * Handles authentication errors and returns user-friendly messages.
   */
  handleAuthError(error: any): Error {
    console.error('Auth error:', error);
    return this.createUserFriendlyError(error.code);
  }

  /**
   * Creates user-friendly error message based on Firebase error code.
   * @param errorCode - Firebase error code
   * @returns User-friendly error
   * @private
   */
  private createUserFriendlyError(errorCode: string): Error {
    const loginErrors = this.getLoginErrors();
    const registrationErrors = this.getRegistrationErrors();
    const securityErrors = this.getSecurityErrors();
    
    return loginErrors[errorCode] || 
           registrationErrors[errorCode] || 
           securityErrors[errorCode] || 
           new Error('An error occurred during authentication');
  }

  /**
   * Gets login-related error mappings.
   * @returns Object with login error mappings
   * @private
   */
  private getLoginErrors(): { [key: string]: Error } {
    return {
      'auth/user-not-found': new Error('Invalid email or password'),
      'auth/wrong-password': new Error('Invalid email or password'),
      'auth/invalid-email': new Error('Please enter a valid email address')
    };
  }

  /**
   * Gets registration-related error mappings.
   * @returns Object with registration error mappings
   * @private
   */
  private getRegistrationErrors(): { [key: string]: Error } {
    return {
      'auth/email-already-in-use': new Error('An account with this email already exists'),
      'auth/weak-password': new Error('Password should be at least 6 characters'),
      'auth/operation-not-allowed': new Error('This operation is not allowed')
    };
  }

  /**
   * Gets security-related error mappings.
   * @returns Object with security error mappings
   * @private
   */
  private getSecurityErrors(): { [key: string]: Error } {
    return {
      'auth/too-many-requests': new Error('Too many failed attempts. Please try again later')
    };
  }

  /**
   * Gets user display name for UI.
   */
  getUserDisplayName(currentUser: User | null): string {
    if (!currentUser) return '';
    if (currentUser.isGuest) {
      return 'GU';
    }

    return currentUser.name
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  /**
   * Gets user's full name.
   */
  getUserFullName(currentUser: User | null): string {
    return currentUser?.name || '';
  }

  /**
   * Gets user's email.
   */
  getUserEmail(currentUser: User | null): string {
    return currentUser?.email || '';
  }

  /**
   * Gets remaining session time in milliseconds.
   */
  getRemainingSessionTime(currentUser: User | null, sessionDuration: number): number {
    if (!currentUser) return 0;
    const currentTime = Date.now();
    const sessionAge = currentTime - currentUser.loginTimestamp;
    const remainingTime = sessionDuration - sessionAge;
    return Math.max(0, remainingTime);
  }

  /**
   * Gets remaining session time formatted as string.
   */
  getRemainingSessionTimeFormatted(remainingMs: number): string {
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
   * Validates that a current user exists for profile update.
   * @throws Error if no authenticated user found
   * @private
   */
  validateCurrentUser(): void {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user found');
    }
  }

  /**
   * Updates Firebase user profile with new display name.
   * @param name - New display name
   * @private
   */
  async updateFirebaseProfile(name: string): Promise<void> {
    await runInInjectionContext(this.injector, () => 
      updateProfile(this.auth.currentUser!, {
        displayName: name.trim()
      })
    );
  }

  /**
   * Handles profile update errors.
   * @param error - Error that occurred
   * @throws Error with profile update failure message
   * @private
   */
  handleProfileUpdateError(error: any): never {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }

  /**
   * Maps Firebase user to our User interface.
   */
  mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      isGuest: firebaseUser.isAnonymous,
      loginTimestamp: Date.now()
    };
  }

  /**
   * Checks if the user session is still valid based on timestamp.
   * @param user - User data to validate
   * @returns True if session is still valid
   */
  isSessionValid(user: any, sessionDuration: number): boolean {
    const currentTime = Date.now();
    const sessionAge = currentTime - (user.loginTimestamp || 0);
    return sessionAge <= sessionDuration;
  }
}

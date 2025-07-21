import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService, User } from './auth-state.service';
import { AuthSessionService } from './auth-session.service';
import { AuthFirebaseService } from './auth-firebase.service';
/**
 * Main authentication service that orchestrates all auth-related operations.
 * Coordinates between Firebase authentication, user state management, and session handling.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authState = inject(AuthStateService);
  private readonly authSession = inject(AuthSessionService);
  private readonly authFirebase = inject(AuthFirebaseService);
  private readonly router = inject(Router);
  // Public state exposure
  readonly currentUser$ = this.authState.currentUser$;
  readonly currentUser = computed(() => this.authState.currentUser);
  readonly isAuthenticated = computed(() => this.authState.isAuthenticated);
  readonly isGuest = computed(() => this.authState.isGuest);
  // Session-related exposures
  readonly sessionTimeRemaining = computed(() => this.authState.getRemainingSessionTime());
  readonly sessionTimeRemainingFormatted = computed(() => 
    this.authState.formatSessionDuration(this.authState.getRemainingSessionTime())
  );
  /**
   * Initialize the authentication service.
   * Sets up Firebase auth listener and session monitoring.
   */
  constructor() {
    this.initializeAuth();
  }

  /**
   * Authenticates user with email and password.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise that resolves when login is complete
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const user = await this.authFirebase.login(email, password);
      // Set user in state
      this.authState.setCurrentUser(user);
      // Start session monitoring
      this.startSessionMonitoring();
      // Navigate to summary page
      await this.router.navigate(['/summary']);
    } catch (error: any) {

      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Registers a new user account.
   * 
   * @param name - User's full name
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise that resolves when registration is complete
   */
  async register(name: string, email: string, password: string): Promise<void> {
    try {
      const user = await this.authFirebase.register(name, email, password);
      // Set user in state
      this.authState.setCurrentUser(user);
      // Start session monitoring
      this.startSessionMonitoring();
      // Navigate to summary page
      await this.router.navigate(['/summary']);
    } catch (error: any) {

      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logs in user as guest.
   * 
   * @returns Promise that resolves when guest login is complete
   */
  async loginAsGuest(): Promise<void> {
    try {
      const user = await this.authFirebase.loginAsGuest();
      // Set user in state
      this.authState.setCurrentUser(user);
      // Start session monitoring
      this.startSessionMonitoring();
      // Navigate to summary page
      await this.router.navigate(['/summary']);
    } catch (error: any) {

      console.error('Guest login error:', error);
      throw error;
    }
  }

  /**
   * Logs out the current user.
   * 
   * @returns Promise that resolves when logout is complete
   */
  async logout(): Promise<void> {
    try {
      await this.authFirebase.logout();
      // Stop session monitoring
      this.authSession.stopSessionCheck();
      // Clear user state
      this.authState.clearUserState();
      // Clear any cached data
      this.clearUserCache();
      // Navigate to login page
      await this.router.navigate(['/login']);
    } catch (error: any) {

      console.error('Error during logout:', error);
      throw new Error('Failed to logout. Please try again.');
    }
  }

  /**
   * Extends the current user session.
   * 
   * @returns Promise that resolves when session is extended
   */
  async extendSession(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('No active session to extend');
    }
    this.authState.extendSession();
  }

  /**
   * Checks if the current user is authenticated.
   * 
   * @returns True if user is authenticated
   */
  isAuthenticatedUser(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Checks if the current user is a guest.
   * 
   * @returns True if user is a guest
   */
  isGuestUser(): boolean {
    return this.authState.isGuest;
  }

  /**
   * Gets the current user data.
   * 
   * @returns Current user or null
   */
  getCurrentUser(): User | null {
    return this.authState.currentUser;
  }

  /**
   * Waits for authentication to be ready.
   * 
   * @returns Promise that resolves when auth is ready
   */
  async waitForAuth(): Promise<User | null> {
    return this.authFirebase.waitForAuthReady();
  }

  /**
   * Updates user profile information.
   * 
   * @param updates - Profile updates to apply
   * @returns Promise that resolves when update is complete
   */
  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('User must be authenticated to update profile');
    }
    try {
      await this.authFirebase.updateUserProfile(updates);
      // Update our user state
      const currentUser = this.getCurrentUser();
      if (currentUser && updates.displayName) {
        const updatedUser = { ...currentUser, name: updates.displayName };
        this.authState.setCurrentUser(updatedUser);
      }
    } catch (error: any) {

      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Initializes the authentication system.
   * Sets up Firebase auth listener and checks for existing session.
   * 
   * @private
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Load user from storage first
      this.authState.loadUserFromStorage();
      // Initialize Firebase auth listener
      this.authFirebase.initializeAuthListener((user) => {
        if (user) {
          this.authState.setCurrentUser(user);
          this.startSessionMonitoring();
        } else {
          this.authState.clearUserState();
          this.authSession.stopSessionCheck();
        }
      });

      // Wait for initial auth state
      const user = await this.authFirebase.waitForAuthReady();
      if (user) {
        this.authState.setCurrentUser(user);
        this.startSessionMonitoring();
      }
    } catch (error: any) {

      console.error('Error initializing auth:', error);
    }
  }

  /**
   * Starts session monitoring for automatic logout.
   * 
   * @private
   */
  private startSessionMonitoring(): void {
    this.authSession.startSessionCheck(() => {
      console.log('Session expired, logging out automatically');
      this.logout();
    });
  }

  /**
   * Generates initials from a user's name.
   * 
   * @param name - User's full name
   * @returns User initials
   * @private
   */
  private generateInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Generates a random color for the user.
   * 
   * @returns Random color hex code
   * @private
   */
  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Clears any cached user data.
   * 
   * @private
   */
  private clearUserCache(): void {
    // Clear any cached data that should be removed on logout
    localStorage.removeItem('join_new_user');
    // Add other cache clearing logic as needed
  }
}

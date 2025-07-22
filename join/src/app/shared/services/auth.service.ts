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
  loginTimestamp: number;
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
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000;
  private sessionCheckInterval: any;
  private injector = inject(Injector);
  /**
   * Constructor initializes auth service with router, Firebase auth, and welcome overlay service
   */
  constructor(
    private router: Router,
    private auth: Auth,
    private welcomeOverlayService: WelcomeOverlayService
  ) {

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
        this.handleAuthStateChange(firebaseUser);
      });
    });
  }

  /**
   * Handles Firebase auth state changes.
   * 
   * @param firebaseUser - Firebase user object or null
   * @private
   */
  private handleAuthStateChange(firebaseUser: FirebaseUser | null): void {
    if (firebaseUser) {
      this.handleUserAuthenticated(firebaseUser);
    } else {
      this.handleUserUnauthenticated();
    }
  }

  /**
   * Handles authenticated user state.
   * 
   * @param firebaseUser - Authenticated Firebase user
   * @private
   */
  private handleUserAuthenticated(firebaseUser: FirebaseUser): void {
    const user = this.mapFirebaseUserToUser(firebaseUser);
    this.currentUserSubject.next(user);
    this.saveUserToStorage(user);
    this.startSessionCheck();
  }

  /**
   * Handles unauthenticated user state.
   * 
   * @private
   */
  private handleUserUnauthenticated(): void {
    if (this.currentUserSubject.value) {
      this.clearCurrentUserSession();
    }
    this.stopSessionCheck();
  }

  /**
   * Clears current user session data.
   * 
   * @private
   */
  private clearCurrentUserSession(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Waits for Firebase auth to be ready and returns the current auth state.
   */
  async waitForAuthReady(): Promise<User | null> {
    return new Promise((resolve) => {
      this.setupAuthReadyListener(resolve);
    });
  }

  /**
   * Sets up auth state listener for auth ready check.
   * 
   * @param resolve - Promise resolve function
   * @private
   */
  private setupAuthReadyListener(resolve: (value: User | null) => void): void {
    runInInjectionContext(this.injector, () => {
      const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
        unsubscribe();
        this.resolveAuthReady(firebaseUser, resolve);
      });
    });
  }

  /**
   * Resolves auth ready promise based on Firebase user state.
   * 
   * @param firebaseUser - Firebase user or null
   * @param resolve - Promise resolve function
   * @private
   */
  private resolveAuthReady(firebaseUser: FirebaseUser | null, resolve: (value: User | null) => void): void {
    if (firebaseUser) {
      this.handleAuthReadyWithUser(firebaseUser, resolve);
    } else {
      resolve(null);
    }
  }

  /**
   * Handles auth ready when user is authenticated.
   * 
   * @param firebaseUser - Authenticated Firebase user
   * @param resolve - Promise resolve function
   * @private
   */
  private handleAuthReadyWithUser(firebaseUser: FirebaseUser, resolve: (value: User | null) => void): void {
    const user = this.mapFirebaseUserToUser(firebaseUser);
    this.currentUserSubject.next(user);
    this.saveUserToStorage(user);
    resolve(user);
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
      loginTimestamp: Date.now()
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
      const userCredential = await this.createFirebaseUser(email, password);
      await this.updateFirebaseUserProfile(userCredential.user, name);
      const user = this.prepareRegisteredUser(userCredential.user, name);
      this.finalizeRegistration(user);
      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Creates a new Firebase user account.
   * 
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
   * Updates Firebase user profile with display name.
   * 
   * @param firebaseUser - Firebase user object
   * @param name - User's display name
   * @private
   */
  private async updateFirebaseUserProfile(firebaseUser: FirebaseUser, name: string): Promise<void> {
    await runInInjectionContext(this.injector, () => 
      updateProfile(firebaseUser, {
        displayName: name.trim()
      })
    );
  }

  /**
   * Prepares user object for registered user.
   * 
   * @param firebaseUser - Firebase user object
   * @param name - User's display name
   * @returns Prepared user object
   * @private
   */
  private prepareRegisteredUser(firebaseUser: FirebaseUser, name: string): User {
    const user = this.mapFirebaseUserToUser(firebaseUser);
    user.name = name.trim();
    user.loginTimestamp = Date.now();
    return user;
  }

  /**
   * Finalizes user registration with storage and event dispatch.
   * 
   * @param user - Registered user object
   * @private
   */
  private finalizeRegistration(user: User): void {
    this.setNewUserFlag();
    this.setCurrentUser(user);
    this.scheduleRegistrationEvent();
  }

  /**
   * Sets new user flag in localStorage.
   * 
   * @private
   */
  private setNewUserFlag(): void {
    localStorage.setItem('join_new_user', 'true');
    console.log('AuthService: New user flag set in localStorage');
  }

  /**
   * Schedules user registration event dispatch.
   * 
   * @private
   */
  private scheduleRegistrationEvent(): void {
    setTimeout(() => {
      console.log('AuthService: Dispatching user-registered event');
      window.dispatchEvent(new CustomEvent('user-registered'));
    }, 500);
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
      this.stopSessionCheck();
      this.welcomeOverlayService.clear();
      await runInInjectionContext(this.injector, () => 
        signOut(this.auth)
      );

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
        this.validateAndLoadSession(user);
      }
    } catch (error) {

      console.error('Error loading user from storage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Validates and loads user session if still valid.
   * @param user - User data from storage
   */
  private validateAndLoadSession(user: any): void {
    if (!this.isSessionValid(user)) {
      this.clearExpiredSession();
      return;
    }
    if (!this.currentUserSubject.value) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Checks if the user session is still valid based on timestamp.
   * @param user - User data to validate
   * @returns True if session is still valid
   */
  private isSessionValid(user: any): boolean {
    const currentTime = Date.now();
    const sessionAge = currentTime - (user.loginTimestamp || 0);
    return sessionAge <= this.SESSION_DURATION;
  }

  /**
   * Clears expired session data from local storage.
   */
  private clearExpiredSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
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
    return this.createUserFriendlyError(error.code);
  }

  /**
   * Creates user-friendly error message based on Firebase error code.
   * 
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
   * 
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
   * 
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
   * 
   * @returns Object with security error mappings
   * @private
   */
  private getSecurityErrors(): { [key: string]: Error } {
    return {
      'auth/too-many-requests': new Error('Too many failed attempts. Please try again later')
    };
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
    this.validateCurrentUser();
    try {
      await this.updateFirebaseProfile(name);
      this.updateLocalUserProfile(name);
    } catch (error) {
      this.handleProfileUpdateError(error);
    }
  }

  /**
   * Validates that a current user exists for profile update.
   * 
   * @throws Error if no authenticated user found
   * @private
   */
  private validateCurrentUser(): void {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user found');
    }
  }

  /**
   * Updates Firebase user profile with new display name.
   * 
   * @param name - New display name
   * @private
   */
  private async updateFirebaseProfile(name: string): Promise<void> {
    await runInInjectionContext(this.injector, () => 
      updateProfile(this.auth.currentUser!, {
        displayName: name.trim()
      })
    );
  }

  /**
   * Updates local user profile and saves to storage.
   * 
   * @param name - New display name
   * @private
   */
  private updateLocalUserProfile(name: string): void {
    const currentUser = this.currentUser;
    if (currentUser) {
      currentUser.name = name.trim();
      this.currentUserSubject.next(currentUser);
      this.saveUserToStorage(currentUser);
    }
  }

  /**
   * Handles profile update errors.
   * 
   * @param error - Error that occurred
   * @throws Error with profile update failure message
   * @private
   */
  private handleProfileUpdateError(error: any): never {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }

  /**
   * Starts periodic session check to auto-logout after 24 hours.
   */
  private startSessionCheck(): void {

    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionExpiry();
    }, 5 * 60 * 1000);

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

    if (sessionAge > this.SESSION_DURATION) {
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

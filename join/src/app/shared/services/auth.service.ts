import { Injectable, OnDestroy, inject, Injector, runInInjectionContext } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, signInAnonymously, updateProfile } from '@angular/fire/auth';
import { WelcomeOverlayService } from './welcome-overlay.service';
import { AuthUtilsService } from './auth-utils.service';
import { AuthSessionManagerService } from './auth-session-manager.service';
import { AuthRegistrationService } from './auth-registration.service';

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
  private authUtils = inject(AuthUtilsService);
  private sessionManager = inject(AuthSessionManagerService);
  private registrationService = inject(AuthRegistrationService);
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
   * @param firebaseUser - Authenticated Firebase user
   * @private
   */
  private handleUserAuthenticated(firebaseUser: FirebaseUser): void {
    const user = this.authUtils.mapFirebaseUserToUser(firebaseUser);
    this.currentUserSubject.next(user);
    this.sessionManager.saveUserToStorage(user, this.STORAGE_KEY);
    this.startSessionCheck();
  }

  /**
   * Handles unauthenticated user state.
   * @private
   */
  private handleUserUnauthenticated(): void {
    if (this.currentUserSubject.value) {
      this.clearCurrentUserSession();
    }
    this.sessionManager.stopSessionCheck();
  }

  /**
   * Clears current user session data.
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
   * @param firebaseUser - Authenticated Firebase user
   * @param resolve - Promise resolve function
   * @private
   */
  private handleAuthReadyWithUser(firebaseUser: FirebaseUser, resolve: (value: User | null) => void): void {
    const user = this.authUtils.mapFirebaseUserToUser(firebaseUser);
    this.currentUserSubject.next(user);
    this.sessionManager.saveUserToStorage(user, this.STORAGE_KEY);
    resolve(user);
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
      const user = this.authUtils.mapFirebaseUserToUser(userCredential.user);
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
      const userCredential = await this.registrationService.createFirebaseUser(email, password);
      await this.registrationService.updateFirebaseUserProfile(userCredential.user, name);
      const user = this.registrationService.prepareRegisteredUser(userCredential.user, name, (fu) => this.authUtils.mapFirebaseUserToUser(fu));
      this.finalizeRegistration(user);
      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Finalizes user registration with storage and event dispatch.
   * @param user - Registered user object
   * @private
   */
  private finalizeRegistration(user: User): void {
    this.registrationService.setNewUserFlag();
    this.setCurrentUser(user);
    this.registrationService.scheduleRegistrationEvent();
  }

  /**
   * Logs in user as guest using Firebase Anonymous Authentication.
   */
  async loginAsGuest(): Promise<User> {
    try {
      const userCredential = await runInInjectionContext(this.injector, () => 
        signInAnonymously(this.auth)
      );
      const user = this.authUtils.mapFirebaseUserToUser(userCredential.user);
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
      this.sessionManager.stopSessionCheck();
      this.welcomeOverlayService.clear();
      await runInInjectionContext(this.injector, () => 
        signOut(this.auth)
      );
      this.router.navigate(['/auth']);
    } catch (error) {
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
    this.sessionManager.saveUserToStorage(user, this.STORAGE_KEY);
  }

  /**
   * Loads user from local storage on app initialization.
   */
  private loadUserFromStorage(): void {
    const user = this.sessionManager.loadUserFromStorage(this.STORAGE_KEY);
    if (user) {
      this.validateAndLoadSession(user);
    }
  }

  /**
   * Validates and loads user session if still valid.
   * @param user - User data from storage
   */
  private validateAndLoadSession(user: any): void {
    if (!this.authUtils.isSessionValid(user, this.SESSION_DURATION)) {
      this.sessionManager.clearExpiredSession(this.STORAGE_KEY);
      return;
    }
    if (!this.currentUserSubject.value) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Gets remaining session time in milliseconds.
   */
  getRemainingSessionTime(): number {
    return this.authUtils.getRemainingSessionTime(this.currentUser, this.SESSION_DURATION);
  }

  /**
   * Gets remaining session time formatted as string.
   */
  getRemainingSessionTimeFormatted(): string {
    const remainingMs = this.getRemainingSessionTime();
    return this.authUtils.getRemainingSessionTimeFormatted(remainingMs);
  }

  /**
   * Handles authentication errors and returns user-friendly messages.
   */
  private handleAuthError(error: any): Error {
    return this.authUtils.handleAuthError(error);
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
    return this.authUtils.getUserDisplayName(this.currentUser);
  }

  /**
   * Gets user's full name.
   */
  getUserFullName(): string {
    return this.authUtils.getUserFullName(this.currentUser);
  }

  /**
   * Gets user's email.
   */
  getUserEmail(): string {
    return this.authUtils.getUserEmail(this.currentUser);
  }

  /**
   * Updates the current user's profile in Firebase Auth.
   * @param name - New display name
   */
  async updateUserProfile(name: string): Promise<void> {
    this.authUtils.validateCurrentUser();
    try {
      await this.authUtils.updateFirebaseProfile(name);
      this.updateLocalUserProfile(name);
    } catch (error) {
      this.authUtils.handleProfileUpdateError(error);
    }
  }

  /**
   * Updates local user profile and saves to storage.
   * @param name - New display name
   * @private
   */
  private updateLocalUserProfile(name: string): void {
    const currentUser = this.currentUser;
    if (currentUser) {
      currentUser.name = name.trim();
      this.currentUserSubject.next(currentUser);
      this.sessionManager.saveUserToStorage(currentUser, this.STORAGE_KEY);
    }
  }

  /**
   * Starts periodic session check to auto-logout after 24 hours.
   */
  private startSessionCheck(): void {
    this.sessionManager.startSessionCheck(() => this.checkSessionExpiry());
  }

  /**
   * Checks if current session has expired and logs out if necessary.
   */
  private checkSessionExpiry(): void {
    if (this.sessionManager.isSessionExpired(this.currentUser, this.SESSION_DURATION)) {
      this.logout();
    }
  }

  /**
   * Stops the session check interval.
   */
  private stopSessionCheck(): void {
    this.sessionManager.stopSessionCheck();
  }
}

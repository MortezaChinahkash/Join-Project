import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, updateProfile, User as FirebaseUser } from '@angular/fire/auth';
import { User } from './auth.service';

/**
 * Service for handling Firebase user registration and profile management.
 * Manages user creation, profile updates, and registration workflows.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthRegistrationService {
  private injector = inject(Injector);
  private auth = inject(Auth);

  /**
   * Creates a new Firebase user account.
   * @param email - User's email address
   * @param password - User's password
   * @returns Firebase user credential
   */
  async createFirebaseUser(email: string, password: string): Promise<any> {
    return await runInInjectionContext(this.injector, () => 
      createUserWithEmailAndPassword(this.auth, email, password)
    );
  }

  /**
   * Updates Firebase user profile with display name.
   * @param firebaseUser - Firebase user object
   * @param name - User's display name
   */
  async updateFirebaseUserProfile(firebaseUser: FirebaseUser, name: string): Promise<void> {
    await runInInjectionContext(this.injector, () => 
      updateProfile(firebaseUser, {
        displayName: name.trim()
      })
    );
  }

  /**
   * Prepares user object for registered user.
   * @param firebaseUser - Firebase user object
   * @param name - User's display name
   * @param mapFirebaseUserToUser - Function to map Firebase user to User
   * @returns Prepared user object
   */
  prepareRegisteredUser(firebaseUser: FirebaseUser, name: string, mapFirebaseUserToUser: (firebaseUser: FirebaseUser) => User): User {
    const user = mapFirebaseUserToUser(firebaseUser);
    user.name = name.trim();
    user.loginTimestamp = Date.now();
    return user;
  }

  /**
   * Sets new user flag in localStorage.
   */
  setNewUserFlag(): void {
    localStorage.setItem('join_new_user', 'true');
  }

  /**
   * Schedules user registration event dispatch.
   */
  scheduleRegistrationEvent(): void {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('user-registered'));
    }, 500);
  }
}

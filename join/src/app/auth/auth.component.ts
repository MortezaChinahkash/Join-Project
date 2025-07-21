import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../shared/services/auth.service';
import { WelcomeOverlayService } from '../shared/services/welcome-overlay.service';
/**
 * Authentication component for login and registration.
 * Handles user authentication with login, registration, and guest access.
 *
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit {
  @ViewChild('containerElement', { static: false }) containerElement!: ElementRef;

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isLoginMode = true;
  isLoading = false;
  errorMessage = '';
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private welcomeOverlayService: WelcomeOverlayService
  ) {}
  /**
   * Angular lifecycle hook - component initialization.
   */
  ngOnInit(): void {
    this.initializeForms();
    this.removeAnimClass();
  }

  /**
   * Removes the 'anim' class from the container element.
   */
  private removeAnimClass(): void {
    setTimeout(() => {
      const container = document.querySelector('.auth-container');
      if (container) { container.classList.remove('anim'); }
      if (this.containerElement?.nativeElement) {
        this.containerElement.nativeElement.classList.remove('anim');
      }
    }, 500);
  }

  /**
   * Initializes the login and registration forms with validation.
   */
  private initializeForms(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptPrivacy: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Custom validator to check if passwords match.
   */
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Switches between login and registration modes.
   */
  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.resetForms();
  }

  /**
   * Resets both forms to their initial state.
   */
  private resetForms(): void {
    this.loginForm.reset();
    this.registerForm.reset();
  }

  /**
   * Handles user login.
   */
  async onLogin(): Promise<void> {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        const { email, password } = this.loginForm.value;
        await this.authService.login(email, password);
        this.welcomeOverlayService.markShouldShow();
        this.router.navigate(['/summary']);
      } catch (error: any) {

        this.errorMessage = this.getErrorMessage(error);
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  /**
   * Handles user registration.
   */
  async onRegister(): Promise<void> {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        const { name, email, password } = this.registerForm.value;
        await this.authService.register(name, email, password);
        this.welcomeOverlayService.markShouldShow();
        this.router.navigate(['/summary']);
      } catch (error: any) {

        this.errorMessage = this.getErrorMessage(error);
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  /**
   * Handles guest login.
   */
  async onGuestLogin(): Promise<void> {
    if (!this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        await this.authService.loginAsGuest();
        this.welcomeOverlayService.markShouldShow();
        this.router.navigate(['/summary']);
      } catch (error: any) {

        this.errorMessage = 'Guest login failed. Please try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }

  /**
   * Marks all form controls as touched to trigger validation display.
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Gets user-friendly error messages from error objects.
   */
  private getErrorMessage(error: any): string {
    if (error?.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return 'No account found with this email address.';
        case 'auth/wrong-password':
          return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
          return 'An account with this email already exists.';
        case 'auth/weak-password':
          return 'Password should be at least 6 characters.';
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        default:
          return 'An error occurred. Please try again.';
      }
    }
    return error?.message || 'An unexpected error occurred.';
  }

  /**
   * Checks if a form field has errors and has been touched.
   */
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Gets the error message for a specific field.
   */
  getFieldErrorMessage(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters`;
      }
    }
    if (fieldName === 'confirmPassword' && form.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    return '';
  }

  /**
   * Gets the placeholder text for input fields - shows error or default placeholder.
   */
  getPlaceholderText(form: FormGroup, fieldName: string, defaultPlaceholder: string): string {
    const errorMessage = this.getFieldErrorMessage(form, fieldName);
    return errorMessage || defaultPlaceholder;
  }

  /**
   * Gets display name for form fields.
   */
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'name': 'Name',
      'email': 'Email',
      'password': 'Password',
      'confirmPassword': 'Confirm Password'
    };
    return displayNames[fieldName] || fieldName;
  }

  /**
   * Checks if login form can be submitted.
   */
  canSubmitLogin(): boolean {
    return this.loginForm.valid && !this.isLoading;
  }

  /**
   * Checks if register form can be submitted.
   */
  canSubmitRegister(): boolean {
    return this.registerForm.valid && !this.isLoading;
  }
}

import { Injectable } from '@angular/core';
/**
 * Service for managing session monitoring and automatic logout.
 * Handles session timeouts and periodic session checks.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private sessionCheckInterval: any;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  /**
   * Starts periodic session checking.
   * 
   * @param onSessionExpired - Callback to execute when session expires
   */
  startSessionCheck(onSessionExpired: () => void): void {
    this.stopSessionCheck(); // Clear any existing interval
    this.sessionCheckInterval = setInterval(() => {
      this.checkSession(onSessionExpired);
    }, this.CHECK_INTERVAL);
  }
  /**
   * Stops periodic session checking.
   */
  stopSessionCheck(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
  /**
   * Checks if current session is still valid.
   * 
   * @param onSessionExpired - Callback to execute when session expires
   * @private
   */
  private checkSession(onSessionExpired: () => void): void {
    try {
      const userData = localStorage.getItem('join_user');
      if (!userData) return;
      const user = JSON.parse(userData);
      const sessionAge = Date.now() - user.loginTimestamp;
      if (sessionAge > this.SESSION_DURATION) {
        onSessionExpired();
      }
    } catch (error) {
      onSessionExpired();
    }
  }
  /**
   * Manually checks session validity.
   * 
   * @param loginTimestamp - Timestamp when user logged in
   * @returns True if session is still valid
   */
  isSessionValid(loginTimestamp: number): boolean {
    const sessionAge = Date.now() - loginTimestamp;
    return sessionAge <= this.SESSION_DURATION;
  }
  /**
   * Gets session timeout warning time (15 minutes before expiry).
   * 
   * @returns Warning time in milliseconds
   */
  getSessionWarningTime(): number {
    return 15 * 60 * 1000; // 15 minutes
  }
  /**
   * Checks if session is approaching expiry.
   * 
   * @param loginTimestamp - Timestamp when user logged in
   * @returns True if session will expire soon
   */
  isSessionApproachingExpiry(loginTimestamp: number): boolean {
    const sessionAge = Date.now() - loginTimestamp;
    const timeUntilExpiry = this.SESSION_DURATION - sessionAge;
    return timeUntilExpiry <= this.getSessionWarningTime();
  }
  /**
   * Gets time until session expires.
   * 
   * @param loginTimestamp - Timestamp when user logged in
   * @returns Time until expiry in milliseconds
   */
  getTimeUntilExpiry(loginTimestamp: number): number {
    const sessionAge = Date.now() - loginTimestamp;
    return Math.max(0, this.SESSION_DURATION - sessionAge);
  }
  /**
   * Extends session by updating timestamp.
   * 
   * @returns New timestamp
   */
  extendSession(): number {
    return Date.now();
  }
  /**
   * Cleanup method for when service is destroyed.
   */
  cleanup(): void {
    this.stopSessionCheck();
  }
}

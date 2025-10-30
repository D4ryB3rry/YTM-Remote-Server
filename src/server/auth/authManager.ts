/**
 * Authentication token management
 */

import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { config } from '../config.js';

export class AuthManager {
  private token: string | null = null;

  /**
   * Get the current auth token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Set the auth token
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Load auth token from file
   */
  async loadToken(): Promise<string | null> {
    try {
      if (existsSync(config.paths.authTokenFile)) {
        const token = await readFile(config.paths.authTokenFile, 'utf-8');
        const trimmedToken = token.trim();
        if (trimmedToken) {
          this.token = trimmedToken;
          console.log('✓ Auth token loaded from authToken.txt');
          return trimmedToken;
        }
      }
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
    return null;
  }

  /**
   * Save auth token to file
   */
  async saveToken(token: string): Promise<boolean> {
    try {
      await writeFile(config.paths.authTokenFile, token, 'utf-8');
      this.token = token;
      console.log('✓ Auth token saved to authToken.txt');
      return true;
    } catch (error) {
      console.error('Error saving auth token:', error);
      return false;
    }
  }

  /**
   * Delete auth token file
   */
  async deleteToken(): Promise<void> {
    try {
      if (existsSync(config.paths.authTokenFile)) {
        await unlink(config.paths.authTokenFile);
        console.log('✓ Auth token deleted');
      }
      this.token = null;
    } catch (error) {
      console.error('Error deleting auth token:', error);
    }
  }

  /**
   * Clear token from memory
   */
  clearToken(): void {
    this.token = null;
  }
}

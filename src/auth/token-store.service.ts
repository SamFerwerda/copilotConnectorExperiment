import { Injectable } from '@nestjs/common';

export interface StoredToken {
  accessToken: string;
  expiresOn: Date;
  scope: string;
}

/**
 * Service to store the user token in memory.
 * In a production environment, you might want to persist this to a database
 * or use a more robust storage mechanism.
 */
@Injectable()
export class TokenStoreService {
  private token: StoredToken | null = null;
  private pkceVerifier: string | null = null;

  /**
   * Store a token
   */
  setToken(token: StoredToken): void {
    this.token = token;
    console.log('Token stored, expires at:', token.expiresOn.toISOString());
  }

  /**
   * Get the stored token
   */
  getToken(): StoredToken | null {
    return this.token;
  }

  /**
   * Get the access token string if valid
   */
  getAccessToken(): string | null {
    if (!this.token) {
      return null;
    }

    if (this.isTokenExpired()) {
      return null;
    }

    return this.token.accessToken;
  }

  /**
   * Check if the token is expired
   */
  isTokenExpired(): boolean {
    if (!this.token) {
      return true;
    }
    return this.token.expiresOn <= new Date();
  }

  /**
   * Check if we have a valid token
   */
  hasValidToken(): boolean {
    return this.token !== null && !this.isTokenExpired();
  }

  /**
   * Clear the stored token
   */
  clearToken(): void {
    this.token = null;
  }

  /**
   * Store PKCE verifier temporarily during auth flow
   */
  setPkceVerifier(verifier: string): void {
    this.pkceVerifier = verifier;
  }

  /**
   * Get and clear the PKCE verifier
   */
  getPkceVerifier(): string | null {
    const verifier = this.pkceVerifier;
    this.pkceVerifier = null;
    return verifier;
  }
}

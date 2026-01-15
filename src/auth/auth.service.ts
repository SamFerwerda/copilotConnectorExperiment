import { Injectable } from '@nestjs/common';
import {
  ConfidentialClientApplication,
  Configuration,
  AuthorizationCodeRequest,
  CryptoProvider,
} from '@azure/msal-node';
import { TokenStoreService, StoredToken } from './token-store.service';
import { CopilotStudioClient, PowerPlatformCloud, AgentType } from '@microsoft/agents-copilotstudio-client';

@Injectable()
export class AuthService {
  private msalClient: ConfidentialClientApplication;
  private cryptoProvider: CryptoProvider;
  private redirectUri: string;
  private scope: string;

  constructor(private readonly tokenStore: TokenStoreService) {
    const clientId = process.env.AZURE_CLIENT_ID || '';
    const clientSecret = process.env.AZURE_CLIENT_SECRET || '';
    const tenantId = process.env.AZURE_TENANT_ID || '';
    this.redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';

    const msalConfig: Configuration = {
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    };

    this.msalClient = new ConfidentialClientApplication(msalConfig);
    this.cryptoProvider = new CryptoProvider();

    // Get the scope for Copilot Studio
    const settings = {
      environmentId: process.env.ENVIRONMENT_ID || "b6822ff0-b0a4-ebfb-8cbc-c69412a98b17",
      schemaName: process.env.SCHEMA_NAME || "crdbe_agent",
      cloud: PowerPlatformCloud.Prod,
      copilotAgentType: AgentType.Published,
    };
    this.scope = CopilotStudioClient.scopeFromSettings(settings);
  }

  /**
   * Generate the authorization URL for user login with PKCE
   */
  async getAuthUrl(): Promise<string> {
    // Generate PKCE codes
    const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

    // Store verifier for later use in callback
    this.tokenStore.setPkceVerifier(verifier);

    const authCodeUrlParameters = {
      scopes: [this.scope],
      redirectUri: this.redirectUri,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256' as const,
    };

    return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<StoredToken> {
    const verifier = this.tokenStore.getPkceVerifier();
    
    if (!verifier) {
      throw new Error('PKCE verifier not found. Please start the login flow again.');
    }

    const tokenRequest: AuthorizationCodeRequest = {
      code,
      scopes: [this.scope],
      redirectUri: this.redirectUri,
      codeVerifier: verifier,
    };

    const response = await this.msalClient.acquireTokenByCode(tokenRequest);

    if (!response) {
      throw new Error('Failed to acquire token');
    }

    const storedToken: StoredToken = {
      accessToken: response.accessToken,
      expiresOn: response.expiresOn || new Date(Date.now() + 3600 * 1000),
      scope: response.scopes.join(' '),
    };

    // Store the token
    this.tokenStore.setToken(storedToken);

    return storedToken;
  }

  /**
   * Get the current token status
   */
  getTokenStatus() {
    const token = this.tokenStore.getToken();
    
    if (!token) {
      return {
        authenticated: false,
        message: 'No token stored. Please login at /auth/login',
      };
    }

    const isExpired = this.tokenStore.isTokenExpired();
    
    return {
      authenticated: !isExpired,
      expiresOn: token.expiresOn.toISOString(),
      isExpired,
      message: isExpired ? 'Token expired. Please login again at /auth/login' : 'Token is valid',
    };
  }
}

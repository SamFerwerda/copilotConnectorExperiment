import { Controller, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { TokenStoreService } from './token-store.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenStore: TokenStoreService,
  ) {}

  /**
   * Initiates the login flow - redirects user to Microsoft login
   */
  @Get('login')
  async login(@Res() res: Response) {
    try {
      const authUrl = await this.authService.getAuthUrl();
      
      // Redirect to Microsoft login
      res.redirect(authUrl);
    } catch (error) {
      console.error('Login error:', error);
      throw new HttpException('Failed to initiate login', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * OAuth callback - exchanges auth code for tokens
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      res.status(401).send(`
        <html>
          <head><title>Authentication Failed</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Authentication Failed</h1>
            <p><strong>Error:</strong> ${error}</p>
            <p>${errorDescription || ''}</p>
            <p><a href="/auth/login">Try again</a></p>
          </body>
        </html>
      `);
      return;
    }

    if (!code) {
      res.status(400).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Error</h1>
            <p>No authorization code received</p>
            <p><a href="/auth/login">Try again</a></p>
          </body>
        </html>
      `);
      return;
    }

    try {
      const tokenInfo = await this.authService.exchangeCodeForToken(code);

      res.send(`
        <html>
          <head><title>Authentication Successful</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>✅ Authentication Successful!</h1>
            <p>You are now logged in.</p>
            <p>Token expires: ${tokenInfo.expiresOn.toLocaleString()}</p>
            <p style="margin-top: 20px;">
              You can now use the API endpoints:
            </p>
            <ul style="list-style: none; padding: 0;">
              <li><code>POST /start</code> - Start a conversation</li>
              <li><code>POST /message</code> - Send a message</li>
            </ul>
            <p><a href="/">Go to API info</a> | <a href="/auth/status">Check status</a></p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).send(`
        <html>
          <head><title>Token Exchange Failed</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Token Exchange Failed</h1>
            <p>${error.message}</p>
            <p><a href="/auth/login">Try again</a></p>
          </body>
        </html>
      `);
    }
  }

  /**
   * Check authentication status
   */
  @Get('status')
  async status() {
    return this.authService.getTokenStatus();
  }

  /**
   * Logout - clears the stored token
   */
  @Get('logout')
  async logout(@Res() res: Response) {
    this.tokenStore.clearToken();
    
    res.send(`
      <html>
        <head><title>Logged Out</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>👋 Logged Out</h1>
          <p>Token has been cleared from the server.</p>
          <p><a href="/auth/login">Login again</a></p>
        </body>
      </html>
    `);
  }
}

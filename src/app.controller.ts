import { Controller, Get } from '@nestjs/common';
import { TokenStoreService } from './auth/token-store.service';

@Controller()
export class AppController {
  constructor(private readonly tokenStore: TokenStoreService) {}

  @Get('/')
  getInfo() {
    const hasValidToken = this.tokenStore.hasValidToken();
    const token = this.tokenStore.getToken();

    return {
      message: 'Clonepilot API',
      authenticated: hasValidToken,
      tokenExpiresOn: token?.expiresOn?.toISOString() || null,
      approaches: {
        delegatedSdk: {
          description: 'Uses Copilot Studio SDK with delegated user credentials',
          baseUrl: '/delegated',
          requiresAuth: true,
        },
        directLine: {
          description: 'Uses Direct Line REST API for bot communication',
          baseUrl: '/directline',
          requiresAuth: false,
          requiresSecret: 'DIRECTLINE_SECRET in .env',
        },
      },
      authEndpoints: {
        login: 'GET /auth/login',
        logout: 'GET /auth/logout',
        status: 'GET /auth/status',
      },
      setup: hasValidToken ? null : 'Visit /auth/login to authenticate (required for delegated SDK approach)',
    };
  }
}

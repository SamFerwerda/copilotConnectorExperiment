import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { TokenStoreService } from './auth/token-store.service';
import {DBService} from './db/db.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly tokenStore: TokenStoreService,
    private readonly dbService: DBService,
  ) {}

  @Get('/')
  getInfo() {
    const hasValidToken = this.tokenStore.hasValidToken();
    const token = this.tokenStore.getToken();

    return {
      message: 'Clonepilot API',
      authenticated: hasValidToken,
      tokenExpiresOn: token?.expiresOn?.toISOString() || null,
      endpoints: {
        login: 'GET /auth/login',
        logout: 'GET /auth/logout',
        status: 'GET /auth/status',
        startConversation: 'POST /start',
        sendMessage: 'POST /message',
      },
      setup: hasValidToken ? null : 'Visit /auth/login to authenticate',
    };
  }

  @Post('/message')
  async sendMessage(@Body() body): Promise<any> {
    const { text, contactId } = body;
    const copilotId = this.dbService.get(contactId);
    const responses = copilotId ? await this.appService.sendMessage(text, copilotId) : await this.appService.startConversation(contactId);
    return responses;
  }
}

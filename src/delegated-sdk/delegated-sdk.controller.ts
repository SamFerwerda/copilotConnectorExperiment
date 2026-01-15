import { Controller, Get, Post, Body } from '@nestjs/common';
import { DelegatedSdkService } from './delegated-sdk.service';
import { TokenStoreService } from '../auth/token-store.service';
import { DBService } from '../db/db.service';

@Controller('delegated')
export class DelegatedSdkController {
  constructor(
    private readonly delegatedSdkService: DelegatedSdkService,
    private readonly tokenStore: TokenStoreService,
    private readonly dbService: DBService,
  ) {}

  @Get('/')
  getInfo() {
    const hasValidToken = this.tokenStore.hasValidToken();
    const token = this.tokenStore.getToken();

    return {
      message: 'Delegated SDK API - Uses Copilot Studio SDK with delegated user credentials',
      authenticated: hasValidToken,
      tokenExpiresOn: token?.expiresOn?.toISOString() || null,
      endpoints: {
        sendMessage: 'POST /delegated/message',
      },
      setup: hasValidToken ? null : 'Visit /auth/login to authenticate',
    };
  }

  @Post('/message')
  async sendMessage(@Body() body): Promise<any> {
    const { text, contactId } = body;
    const copilotId = this.dbService.get(contactId);
    const responses = copilotId 
      ? await this.delegatedSdkService.sendMessage(text, copilotId) 
      : await this.delegatedSdkService.startConversation(contactId);
    return responses;
  }
}

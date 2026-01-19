import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApplicationSdkService } from './application-sdk.service';
import { DBService } from '../db/db.service';

@Controller('application')
export class ApplicationSdkController {
  constructor(
    private readonly applicationSdkService: ApplicationSdkService,
    private readonly dbService: DBService,
  ) {}

  @Get('/')
  getInfo() {
    const isConfigured = this.applicationSdkService.isConfigured();

    return {
      message: 'Application SDK API - Uses Copilot Studio SDK with application/SPN credentials (S2S)',
      configured: isConfigured,
      endpoints: {
        sendMessage: 'POST /application/message',
      },
      note: 'Requires S2S to be enabled by Microsoft for your environment',
      setup: isConfigured 
        ? 'Credentials configured. Make sure S2S is enabled for your environment.' 
        : 'Add AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID to .env',
    };
  }

  @Post('/message')
  async sendMessage(@Body() body): Promise<any> {
    const { text, contactId } = body;
    const copilotId = this.dbService.get(`app:${contactId}`);
    const responses = copilotId 
      ? await this.applicationSdkService.sendMessage(text, copilotId) 
      : await this.applicationSdkService.startConversation(contactId);
    return responses;
  }
}

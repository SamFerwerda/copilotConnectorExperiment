import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ClientSecretCredential } from '@azure/identity';
import { CopilotStudioClient, PowerPlatformCloud, AgentType } from '@microsoft/agents-copilotstudio-client';
import { Activity, ActivityTypes } from '@microsoft/agents-activity';
import { DBService } from '../db/db.service';

// Copilot settings
const getCopilotSettings = () => ({
  environmentId: process.env.ENVIRONMENT_ID || "",
  schemaName: process.env.SCHEMA_NAME || "",
  cloud: PowerPlatformCloud.Prod,
  copilotAgentType: AgentType.Published,
});

@Injectable()
export class ApplicationSdkService {
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;

  constructor(private dbService: DBService) {
    this.clientId = process.env.AZURE_CLIENT_ID || '';
    this.clientSecret = process.env.AZURE_CLIENT_SECRET || '';
    this.tenantId = process.env.AZURE_TENANT_ID || '';

    if (!this.clientId || !this.clientSecret || !this.tenantId) {
      console.warn('⚠️  Azure AD credentials not fully configured in .env');
      console.warn('   Required: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID');
    }
  }

  /**
   * Get an access token using client credentials (application permissions)
   */
  private async getApplicationToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret || !this.tenantId) {
      throw new HttpException(
        'Azure AD credentials not configured. Add AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID to .env',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const settings = getCopilotSettings();
    const scope = CopilotStudioClient.scopeFromSettings(settings);

    const credential = new ClientSecretCredential(
      this.tenantId,
      this.clientId,
      this.clientSecret,
      { authorityHost: `https://login.microsoftonline.com/${this.tenantId}` }
    );

    try {
      const tokenResponse = await credential.getToken(scope);
      if (!tokenResponse) {
        throw new Error('Failed to acquire token');
      }
      return tokenResponse.token;
    } catch (error) {
      console.error('Error acquiring application token:', error);
      throw new HttpException(
        'Failed to acquire application token. Make sure S2S is enabled for your environment.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Get a Copilot client using application credentials (SPN token)
   */
  private async getCopilotClient(): Promise<CopilotStudioClient> {
    const settings = getCopilotSettings();
    const token = await this.getApplicationToken();
    return new CopilotStudioClient(settings, token);
  }

  /**
   * Send a message to an existing conversation
   */
  async sendMessage(text: string, conversationId: string): Promise<any> {
    const copilotClient = await this.getCopilotClient();
    const activity = Activity.fromObject({ 
      type: ActivityTypes.Message,
      text,
      conversation: { id: conversationId },
    });
    console.log('[Application SDK] Sending message', activity);
    const responses = [];
    for await (const response of copilotClient.sendActivityStreaming(activity, conversationId)){
      responses.push(response);
    };
    return responses;
  }

  /**
   * Start a new conversation using application credentials
   */
  async startConversation(contactId: string) {
    const copilotClient = await this.getCopilotClient();
    
    try {
      console.log('[Application SDK] Starting conversation...');
      const responses = [];
      for await (const response of copilotClient.startConversationStreaming(true)) {
        responses.push(response);
      }
      const conversationId = responses.find(activity => !!activity.conversation?.id)?.conversation?.id;
      this.dbService.set(`app:${contactId}`, conversationId);
      console.log(`[Application SDK] Conversation started: ${conversationId}`);
      return responses;
    } catch (error) {
      console.error('[Application SDK] Error starting conversation:', error);
      throw new HttpException(
        `Failed to start conversation: ${error.message}. Make sure S2S is enabled for your environment.`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.tenantId);
  }
}

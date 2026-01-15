import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CopilotStudioClient, PowerPlatformCloud, AgentType } from '@microsoft/agents-copilotstudio-client';
import { TokenStoreService } from './auth/token-store.service';
import { Activity, ActivityTypes } from '@microsoft/agents-activity';
import { DBService } from './db/db.service';

// Copilot settings - can be moved to config
const getCopilotSettings = () => ({
  environmentId: process.env.ENVIRONMENT_ID || "b6822ff0-b0a4-ebfb-8cbc-c69412a98b17",
  schemaName: process.env.SCHEMA_NAME || "crdbe_agent",
  cloud: PowerPlatformCloud.Prod,
  copilotAgentType: AgentType.Published,
});

@Injectable()
export class AppService {
  constructor(private readonly tokenStore: TokenStoreService, private dbService: DBService) {}
  /**
   * Get the user token from the token store, this is temprarily stored in memory. In the future would like to do S2S authentication but this
   * has to be enabled by microsoft per env.
   */
  private getUserToken(): string {
    const token = this.tokenStore.getAccessToken();
    
    if (!token) {
      if (this.tokenStore.isTokenExpired() && this.tokenStore.getToken()) {
        throw new HttpException(
          'User token has expired. Please login again at /auth/login',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        'Not authenticated. Please login at /auth/login',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return token;
  }

  /**
   * Get a Copilot client using the user's delegated token
   */
  private getCopilotClient(): CopilotStudioClient {
    const settings = getCopilotSettings();
    const userToken = this.getUserToken();
    return new CopilotStudioClient(settings, userToken);
  }

  /**
   * Send a message to an existing conversation
   */
  async sendMessage(text: string, conversationId: string): Promise<any> {
    const copilotClient = this.getCopilotClient();
    const activity = Activity.fromObject({ 
      type: ActivityTypes.Message,
      text,
      conversation: { id: conversationId },
    });
    console.log('Sending message', activity);
    const responses = [];
    for await (const response of copilotClient.sendActivityStreaming(activity, conversationId)){
      responses.push(response);
    };
    return responses;
  }

  /**
   * Start a new conversation
   */
  async startConversation(contactId: string) {
    const copilotClient = this.getCopilotClient();
    
    try {
      const responses = [];
      for await (const response of copilotClient.startConversationStreaming(true)) {
        responses.push(response);
      }
      const conversationId = responses.find(activity => !!activity.conversation?.id)?.conversation?.id;
      this.dbService.set(contactId, conversationId);
      return { message: "Conversation started", responses};
     } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  }
}

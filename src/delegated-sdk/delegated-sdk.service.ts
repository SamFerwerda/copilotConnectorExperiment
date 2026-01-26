import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CopilotStudioClient, PowerPlatformCloud, AgentType } from '@microsoft/agents-copilotstudio-client';
import { TokenStoreService } from '../auth/token-store.service';
import { Activity, ActivityTypes } from '@microsoft/agents-activity';
import { DBService } from '../db/db.service';


// delay for ms 
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Copilot settings
const getCopilotSettings = () => ({
  environmentId: process.env.ENVIRONMENT_ID || "",
  schemaName: process.env.SCHEMA_NAME || "",
  cloud: PowerPlatformCloud.Prod,
  copilotAgentType: AgentType.Published,
});

let client: CopilotStudioClient | null = null;

@Injectable()
export class DelegatedSdkService {
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
   * Get a Copilot client
   */
  private getCopilotClient(): CopilotStudioClient {
    if (client) {
      return client;
    }
    const settings = getCopilotSettings();
    const userToken = this.getUserToken();
    client = new CopilotStudioClient(settings, userToken);
    return client;
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
   * Start a new conversation, this also initiates a new conversation id and saves it in a fake DB
   */
  async startConversation(contactId: string, simulatedAsyncWorkInMs = 0): Promise<any> {
    const copilotClient = this.getCopilotClient();
    
    try {
      const responses = [];
      const startConversationEvent = Activity.fromObject({ type: ActivityTypes.Event, value: {test: true, properties: {x: 1, y:true, z: "test string"}}, name: "startConversation" });
      
      // This setup will start a conversations but it will not provide you the conversation id (which we need to connect back to same conversation).
      // Therefore to get the conversation id you either need to start conversation WITH event or send a message using the same 
      // client after the start of the conversation.
      for await (const response of copilotClient.startConversationStreaming(false)) {
        responses.push(response);
      }

      // simulate some async work being done here
      await delay(simulatedAsyncWorkInMs);

      for await (const response of copilotClient.sendActivityStreaming(
        startConversationEvent)){
        responses.push(response);
      }
      const conversationId = responses.find(activity => !!activity.conversation?.id)?.conversation?.id;
      console.log(`Started contactId ${contactId} conversation with ID ${conversationId}`);
      
      this.dbService.set(contactId, conversationId);
      return responses;
     } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  }
}

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DBService } from '../db/db.service';
import { Activity } from '@microsoft/agents-activity';

interface DirectLineToken {
  token: string;
  conversationId: string;
  watermark?: string;
}

interface DirectLineActivity {
  type: string;
  id?: string;
  timestamp?: string;
  from?: { id: string; name?: string };
  text?: string;
  [key: string]: any;
}

interface DirectLineResponse {
  activities: DirectLineActivity[];
  watermark: string;
}

@Injectable()
export class DirectLineService {
  private directLineSecret: string;
  private directLineEndpoint: string;
  private conversationTokens: Map<string, DirectLineToken> = new Map();

  constructor(private dbService: DBService) {
    this.directLineSecret = process.env.DIRECTLINE_SECRET || '';
    this.directLineEndpoint = process.env.DIRECTLINE_ENDPOINT || 'https://europe.directline.botframework.com/v3/directline';
    
    if (!this.directLineSecret) {
      console.warn('⚠️  DIRECTLINE_SECRET not configured in .env');
    }
  }

  /**
   * Start a new conversation through Direct Line API
   */
  async startConversation(contactId: string) {
    if (!this.directLineSecret) {
      throw new HttpException(
        'Direct Line secret not configured. Add DIRECTLINE_SECRET to .env',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await fetch(`${this.directLineEndpoint}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.directLineSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new HttpException(
          `Failed to start conversation: ${error}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();
      
      // Store the token and conversation ID
      const tokenInfo: DirectLineToken = {
        token: data.token,
        conversationId: data.conversationId,
      };
      this.conversationTokens.set(contactId, tokenInfo);
      
      // Also store in DB for persistence
      this.dbService.set(`directline:${contactId}`, data.conversationId);

      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error starting Direct Line conversation:', error);
      throw new HttpException(
        'Failed to start Direct Line conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send a message and poll for responses until all activities are received
   */
  async sendActivityAndWaitForReply(activity: Partial<Activity>, contactId: string): Promise<DirectLineActivity[]> {
    try {
        console.log('Sending activity:', activity);
        const tokenInfo = this.conversationTokens.get(contactId);
        // Send the message
        await this.sendActivity(activity, contactId);

        // Poll for responses using the stored watermark
        const { activities, watermark } = await this.pollForActivities(tokenInfo.token, tokenInfo.conversationId, contactId);
        
        // Update the stored watermark for next time
        tokenInfo.watermark = watermark;
        
        return activities;
    } catch (error) {
        if (error instanceof HttpException) throw error;
        console.error('Error sending message:', error);
        throw new HttpException(
            'Failed to send message',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }

  private async sendActivity(activity: Partial<Activity>, contactId: string): Promise<void> {
    const tokenInfo = this.conversationTokens.get(contactId);
    
    if (!tokenInfo) {
      throw new HttpException(
        'No active conversation found. Start a conversation first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { token, conversationId } = tokenInfo;

    const response = await fetch(
      `${this.directLineEndpoint}/conversations/${conversationId}/activities`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new HttpException(
        `Failed to send activity: ${error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Poll the activities endpoint until:
   * 1. An activity returns with channelData.askForCustomerInput = true
   * 2. Or 7 seconds timeout without receiving such an activity
   * Uses watermark from session to only get new activities
   */
  private async pollForActivities(
    token: string,
    conversationId: string,
    contactId: string,
    timeoutMs: number = 7000,
    pollIntervalMs: number = 300,
  ): Promise<{ activities: DirectLineActivity[]; watermark: string }> {
    // Get the stored watermark from session
    const tokenInfo = this.conversationTokens.get(contactId);
    let watermark: string | undefined = tokenInfo?.watermark;
    
    const collectedActivities: DirectLineActivity[] = [];
    const startTime = Date.now();
    let foundAskForCustomerInput = false;

    while (Date.now() - startTime < timeoutMs) {
      const url = watermark
        ? `${this.directLineEndpoint}/conversations/${conversationId}/activities?watermark=${watermark}`
        : `${this.directLineEndpoint}/conversations/${conversationId}/activities`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to poll activities:', await response.text());
        break;
      }

      const data: DirectLineResponse = await response.json();
      watermark = data.watermark;

      if (data.activities && data.activities.length > 0) {
        for (const activity of data.activities) {
          // Skip activities we've already collected
          if (collectedActivities.some(a => a.id === activity.id)) {
            continue;
          }

          // Skip user messages, only collect bot responses
          if (activity.from?.id === 'user') {
            continue;
          }

          collectedActivities.push(activity);

          // Check if this activity has askForCustomerInput = true
          if (activity.channelData?.askForCustomerInput === true || activity.name === "askForCustomerInput") {
            foundAskForCustomerInput = true;
            console.log('Found activity with askForCustomerInput = true, stopping poll');
            break;
          }
        }

        // If we found the askForCustomerInput flag, stop polling
        if (foundAskForCustomerInput) {
          break;
        }
      }

      await this.delay(pollIntervalMs);
    }

    const elapsedMs = Date.now() - startTime;
    console.log(`Collected ${collectedActivities.length} activities after ${elapsedMs}ms (askForCustomerInput: ${foundAskForCustomerInput})`);
    return { activities: collectedActivities, watermark: watermark || '' };
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get conversation info for a contact
   */
  getConversationInfo(contactId: string): { hasConversation: boolean; conversationId?: string } {
    const tokenInfo = this.conversationTokens.get(contactId);
    return {
      hasConversation: !!tokenInfo,
      conversationId: tokenInfo?.conversationId,
    };
  }
}

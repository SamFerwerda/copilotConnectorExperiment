import { Controller, Get, Post, Body } from '@nestjs/common';
import { DirectLineService } from './directline.service';
import { Activity } from '@microsoft/agents-activity';

@Controller('directline')
export class DirectLineController {
  constructor(private readonly directLineService: DirectLineService) {}

  @Get('/')
  getInfo() {
    return {
      message: 'Direct Line API - Uses Direct Line REST API for bot communication',
      endpoints: {
        sendMessage: 'POST /directline/message',
      },
      note: 'Requires DIRECTLINE_SECRET in .env',
    };
  }

  @Post('/message')
  async sendMessage(@Body() body): Promise<any> {
    const { text = '', contactId } = body;
    if (!contactId) {
      return { error: 'contactId is required' };
    }
    let activity: Partial<Activity> = { type: 'message', from: { id: 'user' }, text };

    // Check if conversation exists, if not start one first
    const conversationInfo = this.directLineService.getConversationInfo(contactId);
    if (!conversationInfo.hasConversation) {
        console.log('No conversation found, starting new one');
        await this.directLineService.startConversation(contactId);
        activity = { type: 'event', name: 'startConversation', from: { id: 'user' }, text: "" };
    }

    return await this.directLineService.sendActivityAndWaitForReply(activity, contactId);
  }
}

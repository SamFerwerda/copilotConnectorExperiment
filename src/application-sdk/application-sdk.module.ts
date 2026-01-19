import { Module } from '@nestjs/common';
import { ApplicationSdkController } from './application-sdk.controller';
import { ApplicationSdkService } from './application-sdk.service';
import { DBService } from '../db/db.service';

@Module({
  controllers: [ApplicationSdkController],
  providers: [ApplicationSdkService, DBService],
  exports: [ApplicationSdkService],
})
export class ApplicationSdkModule {}

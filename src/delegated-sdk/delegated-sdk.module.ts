import { Module } from '@nestjs/common';
import { DelegatedSdkController } from './delegated-sdk.controller';
import { DelegatedSdkService } from './delegated-sdk.service';
import { DBService } from '../db/db.service';

@Module({
  controllers: [DelegatedSdkController],
  providers: [DelegatedSdkService, DBService],
  exports: [DelegatedSdkService],
})
export class DelegatedSdkModule {}

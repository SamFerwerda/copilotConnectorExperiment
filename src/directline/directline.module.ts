import { Module } from '@nestjs/common';
import { DirectLineController } from './directline.controller';
import { DirectLineService } from './directline.service';
import { DBService } from '../db/db.service';

@Module({
  controllers: [DirectLineController],
  providers: [DirectLineService, DBService],
  exports: [DirectLineService],
})
export class DirectLineModule {}

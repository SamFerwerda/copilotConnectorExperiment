import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenStoreService } from './token-store.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenStoreService],
  exports: [AuthService, TokenStoreService],
})
export class AuthModule {}

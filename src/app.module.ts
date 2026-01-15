import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DelegatedSdkModule } from './delegated-sdk/delegated-sdk.module';
import { DirectLineModule } from './directline/directline.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    DelegatedSdkModule,
    DirectLineModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

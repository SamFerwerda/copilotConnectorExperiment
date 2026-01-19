import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DelegatedSdkModule } from './delegated-sdk/delegated-sdk.module';
import { DirectLineModule } from './directline/directline.module';
import { ApplicationSdkModule } from './application-sdk/application-sdk.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    DelegatedSdkModule,
    DirectLineModule,
    ApplicationSdkModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

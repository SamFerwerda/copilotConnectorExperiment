import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function main() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
  console.log('\n🚀 Application is running on: http://localhost:3000');
  console.log('🔐 Opening browser for authentication...\n');

  // Dynamic import required because 'open' is an ESM-only package
  const open = (await import('open')).default;
  await open('http://localhost:3000/auth/login');
}
main();

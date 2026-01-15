<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Clonepilot - A NestJS application that integrates with Microsoft Copilot Studio using delegated user authentication.

## Installation

```bash
$ npm install
```

## Configuration

Create a `.env` file with the following variables:

```env
# Azure AD App Registration
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-client-secret

# OAuth Redirect URI (must match Azure AD app registration)
REDIRECT_URI=http://localhost:3000/auth/callback

# Copilot Studio settings
ENVIRONMENT_ID=your-environment-id
SCHEMA_NAME=your-schema-name
```

### Azure AD App Registration Setup

1. Go to Azure Portal > Azure Active Directory > App registrations
2. Create a new registration or use an existing one
3. Under "Authentication", add a redirect URI: `http://localhost:3000/auth/callback`
4. Under "API permissions", add the required Copilot Studio / Power Platform permissions
5. Make sure to grant admin consent if required

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | GET | Initiates the OAuth2 login flow - redirects to Microsoft login |
| `/auth/callback` | GET | OAuth callback - handles the authorization code exchange |
| `/auth/status` | GET | Check if the user is authenticated |
| `/auth/logout` | GET | Logout and clear session |

### Copilot Studio (Requires Authentication)

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/start` | POST | - | Start a new conversation with Copilot |
| `/message` | POST | `{ "text": "...", "conversationId": "..." }` | Send a message to an existing conversation |

## Usage Flow

1. **Login**: Navigate to `http://localhost:3000/auth/login` in your browser
2. **Authenticate**: Sign in with your Microsoft account
3. **Use API**: After successful login, you can use the `/start` and `/message` endpoints
4. **Check Status**: Use `/auth/status` to verify your authentication status
5. **Logout**: Use `/auth/logout` to clear your session

## Example Usage

```bash
# Check auth status
curl http://localhost:3000/auth/status

# Start a conversation (requires authentication via browser first)
curl -X POST http://localhost:3000/start \
  -H "Content-Type: application/json" \
  --cookie "connect.sid=your-session-cookie"

# Send a message
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "conversationId": "conv-id-from-start"}' \
  --cookie "connect.sid=your-session-cookie"
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

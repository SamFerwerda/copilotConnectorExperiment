## Description

This project is used as a playground for the @microsoft/agents-copilotstudio-client sdk. To properly use this repository you will need to have the prerequisites given by their package. I will also give some other details I found during the creation of this setup.

This project includes two approaches for connecting to Copilot Studio:
1. **Delegated SDK** - Uses the Copilot Studio SDK with delegated user credentials (OAuth)
2. **Direct Line API** - Uses the Direct Line REST API (no user authentication required)

## Extra Prerequisites 
Using the SDK I found the following information helpful:
1. If you use delegated permissions make sure your redirectURI is added to your service principle
2. If you want to use Confidential client with Service principle token, you will need to request microsoft to enable S2S. The exact error you will get if you havent done this is: ThirdPartyAuthenticatedPublishedBotController.EnableS2SAuthFeature not enabled. See [community question](https://community.powerplatform.com/forums/thread/details/?threadid=1410e204-94b4-f011-bbd3-00224826fe9a).

## Configuration
Create a `.env` file with the following variables:

```env
# Azure AD App Registration (for Delegated SDK approach)
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-client-secret

# OAuth Redirect URI (must match Azure AD app registration)
REDIRECT_URI=http://localhost:3000/auth/callback

# Copilot Studio settings
ENVIRONMENT_ID=your-environment-id
SCHEMA_NAME=your-schema-name

# Direct Line settings (for Direct Line API approach)
# Get from Copilot Studio > Settings > Authentication
DIRECTLINE_SECRET=your-directline-secret
DIRECTLINE_ENDPOINT=https://europe.directline.botframework.com/v3/directline
```

### Azure AD App Registration Setup (for Delegated SDK)
1. Go to Azure Portal > Azure Active Directory > App registrations
2. Create a new registration or use an existing one
3. Under "Authentication", add a redirect URI: `http://localhost:3000/auth/callback`
4. Also, under settings enable public client flows (only for delegated permissions)
4. Under "API permissions", add the required Copilot Studio / Power Platform permissions
  - If you want to use the users token use *delegated*
  - If you want to use a confidential client use *application*
6. Make sure to grant admin consent if required (only for application)

### Direct Line Setup
1. Go to Copilot Studio > Your Bot > Settings > Channels
2. Select "Mobile app" or configure Direct Line
3. Copy the Direct Line secret
4. Add it to your `.env` file as `DIRECTLINE_SECRET`
5. Use the appropriate regional endpoint (e.g., `https://europe.directline.botframework.com/v3/directline`)

## Running it locally

```bash
$ npm install
```

```bash
$ npm run start
```

The application will force you to login (for delegated SDK) after which you can use postman to call the endpoints.

## API Endpoints

### Authentication (for Delegated SDK)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | GET | Initiates the OAuth2 login flow - redirects to Microsoft login |
| `/auth/callback` | GET | OAuth callback - handles the authorization code exchange |
| `/auth/status` | GET | Check if the user is authenticated |
| `/auth/logout` | GET | Logout and clear session |

### Delegated SDK Endpoints (Requires Authentication)

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/delegated/` | GET | - | Get info about the delegated SDK approach |
| `/delegated/message` | POST | `{ "text": "...", "contactId": "..." }` | Send a message (creates conversation if needed) |

### Direct Line API Endpoints (No Authentication Required)

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/directline/` | GET | - | Get info about the Direct Line approach |
| `/directline/start` | POST | `{ "contactId": "..." }` | Start a new conversation and get welcome messages |
| `/directline/message` | POST | `{ "text": "...", "contactId": "..." }` | Send a message and get bot responses |

## Usage Flow

### Option 1: Delegated SDK (with user authentication)

1. **Configure**: Set up Azure AD and add credentials to `.env`
2. **Run application**: `npm run start`
3. **Authenticate**: Browser opens automatically, sign in with Microsoft account
4. **Have a conversation**: Use `POST /delegated/message` with `{ "text": "hello", "contactId": "user123" }`

### Option 2: Direct Line API (without user authentication)

1. **Configure**: Add `DIRECTLINE_SECRET` and `DIRECTLINE_ENDPOINT` to `.env`
2. **Run application**: `npm run start`
3. **Start conversation**: 
   ```bash
   curl -X POST http://localhost:3000/directline/start \
     -H "Content-Type: application/json" \
     -d '{"contactId": "user123"}'
   ```
4. **Send messages**:
   ```bash
   curl -X POST http://localhost:3000/directline/message \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello!", "contactId": "user123"}'
   ```

## Testing with Postman

### Direct Line API

1. **Start a conversation**
   - Method: `POST`
   - URL: `http://localhost:3000/directline/start`
   - Body (JSON): `{ "contactId": "test-user-1" }`
   - Response: Bot's welcome messages

2. **Send a message**
   - Method: `POST`
   - URL: `http://localhost:3000/directline/message`
   - Body (JSON): `{ "text": "What can you help me with?", "contactId": "test-user-1" }`
   - Response: Bot's reply messages

### Delegated SDK

1. First visit `http://localhost:3000/auth/login` in your browser to authenticate
2. Then use Postman:
   - Method: `POST`
   - URL: `http://localhost:3000/delegated/message`
   - Body (JSON): `{ "text": "Hello!", "contactId": "test-user-1" }`

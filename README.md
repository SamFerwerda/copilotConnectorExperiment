## Description

This project is used as a playground for the @microsoft/agents-copilotstudio-client sdk. To properly use this repository you will need to have the prerequisites given by their package. I will also give some other details I found during the creation of this setup. 

## Extra Prerequisites 
Using the SDK I found the following information helpful:
1. If you use delegated permissions make sure your redirectURI is added to your service principle
2. If you want to use Confidential client with Service principle token, you will need to request microsoft to enable S2S. The exact error you will get if you havent done this is: ThirdPartyAuthenticatedPublishedBotController.EnableS2SAuthFeature not enabled. See [community question](https://community.powerplatform.com/forums/thread/details/?threadid=1410e204-94b4-f011-bbd3-00224826fe9a).

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
4. Also, under settings enable public client flows (only for delegated permissions)
4. Under "API permissions", add the required Copilot Studio / Power Platform permissions
  - If you want to use the users token use *delegated*
  - If you want to use a confidential client use *application*
6. Make sure to grant admin consent if required (only for application)

## Running it locally

```bash
$ npm install
```

```bash
$ npm start dev
```

The application will force you to login after which you can use postman to call the */message* endpoint.

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
| `/message` | POST | `{ "text": "...", "contactId": "..." }` | Send a message to an existing conversation or create a new one if one doesnt exist with the contactId provided |

## Usage Flow

1. **configure**: Do the configuration first
2. **Run application**: Call `npm run start`
3. **Authenticate**: Use an ms account to authenticate
4. **have a conversation**: Use `/message` to start the conversations and send messages

import { ClientSecretCredential } from '@azure/identity';

export async function getToken(scope: string){
    const clientId = process.env.AZURE_CLIENT_ID || '';
    const clientSecret = process.env.AZURE_CLIENT_SECRET || '';
    const tenantId = process.env.AZURE_TENANT_ID || '';
    
    const clientCredentials = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret,
        { authorityHost: `https://login.microsoftonline.com/${tenantId}` }
    );

    return await clientCredentials.getToken(scope);
}
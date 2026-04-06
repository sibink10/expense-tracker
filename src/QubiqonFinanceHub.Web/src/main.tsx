import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { Toaster } from 'react-hot-toast';
import App from "./App";


const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'localStorage' as const, storeAuthStateInCookie: false },
};

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) msalInstance.setActiveAccount(accounts[0]);

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && (event.payload as any)?.account) {
      msalInstance.setActiveAccount((event.payload as any).account);
    }
  });

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
        <Toaster position="bottom-right" toastOptions={{
          style: { fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, borderRadius: '10px' },
          success: { style: { background: '#0F6E56', color: '#fff' } },
          error: { style: { background: '#A32D2D', color: '#fff' } },
        }} />
      </MsalProvider>
    </React.StrictMode>
  );
});

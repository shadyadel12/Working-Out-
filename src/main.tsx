import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/global.css';
import { LanguageProvider } from './i18n/LanguageProvider';

// Security warning — deters casual DevTools abuse (same pattern as Facebook/Twitter)
console.log(
  '%cStop!',
  'color: red; font-size: 48px; font-weight: bold;'
);
console.log(
  '%cThis browser feature is for developers only. If someone told you to paste something here, it is a scam and could give them access to your account.\n\n© ' +
    new Date().getFullYear() +
    ' Coach Platform. All rights reserved. Unauthorized reproduction is prohibited.',
  'font-size: 14px;'
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider><App /></LanguageProvider>
    </QueryClientProvider>
  </StrictMode>
);

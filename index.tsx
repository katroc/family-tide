
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { uiLogger } from './utils/logger';

uiLogger.info('Starting React app');

const rootElement = document.getElementById('root');
if (!rootElement) {
  uiLogger.error('Could not find root element', new Error('Root element not found'));
  throw new Error("Could not find root element to mount to");
}

uiLogger.debug('Root element found - creating React root');

const root = ReactDOM.createRoot(rootElement);

uiLogger.debug('React root created - rendering app');

// Temporarily remove StrictMode to see if it's causing issues
root.render(<App />);

uiLogger.info('App rendered successfully');
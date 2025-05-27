
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log('🚀 Starting React app...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Could not find root element!');
  throw new Error("Could not find root element to mount to");
}

console.log('✅ Root element found, creating React root...');

const root = ReactDOM.createRoot(rootElement);

console.log('✅ React root created, rendering app...');

// Temporarily remove StrictMode to see if it's causing issues
root.render(<App />);

console.log('✅ App render called successfully!');
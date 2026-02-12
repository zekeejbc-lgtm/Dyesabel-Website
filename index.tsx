import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// ✅ Import the new component
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* ✅ Wrapped in ErrorBoundary to prevent white-screen crashes */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
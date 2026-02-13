import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster, toast } from 'sonner';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css'; // Ensure your global styles are imported

// Service Worker Registration and Update Handling
let updateToastId: string | number | undefined;
let updateToastActive = false;

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (updateToastActive) return;
    updateToastActive = true;
    updateToastId = toast.info("New version available", {
      description: "Refresh to update the app.",
      duration: Infinity, // Keep open until action
      action: {
        label: "Refresh",
        onClick: () => {
          updateSW(true);
          if (updateToastId !== undefined) {
            toast.dismiss(updateToastId);
          }
          updateToastActive = false;
        },
      },
    });
  },
  onOfflineReady() {
    toast.success("App ready for offline use.");
  },
});

// Handle offline sync messages from SW
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data as { type?: string };
    if (!data) return;

    if (data.type === "OFFLINE_WRITE_QUEUED") {
      toast.info("You're offline", {
        description: "Your changes are queued and will sync when you're online.",
        duration: 5000,
      });
    }

    if (data.type === "OFFLINE_QUEUE_SYNCED") {
      toast.success("Back online", {
        description: "Queued changes have been synced.",
        duration: 4000,
      });
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Toaster position="bottom-right" richColors />
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
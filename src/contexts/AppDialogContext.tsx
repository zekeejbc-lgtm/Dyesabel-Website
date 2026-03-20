import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, HelpCircle, X } from 'lucide-react';

type DialogVariant = 'alert' | 'confirm';

interface DialogOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface DialogRequest extends DialogOptions {
  id: number;
  variant: DialogVariant;
  message: string;
  resolve: (value: boolean | void) => void;
}

interface AppDialogContextValue {
  showAlert: (message: string, options?: DialogOptions) => Promise<void>;
  showConfirm: (message: string, options?: DialogOptions) => Promise<boolean>;
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export const AppDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const requestIdRef = useRef(0);

  const activeDialog = queue[0] || null;

  const closeDialog = useCallback((value: boolean | void) => {
    setQueue((current) => {
      if (!current.length) return current;
      const [first, ...rest] = current;
      first.resolve(value);
      return rest;
    });
  }, []);

  const enqueueDialog = useCallback((
    variant: DialogVariant,
    message: string,
    options?: DialogOptions
  ) => new Promise<boolean | void>((resolve) => {
    requestIdRef.current += 1;
    setQueue((current) => [
      ...current,
      {
        id: requestIdRef.current,
        variant,
        message,
        title: options?.title,
        confirmLabel: options?.confirmLabel,
        cancelLabel: options?.cancelLabel,
        resolve
      }
    ]);
  }), []);

  const showAlert = useCallback((message: string, options?: DialogOptions) => {
    return enqueueDialog('alert', message, options).then(() => undefined);
  }, [enqueueDialog]);

  const showConfirm = useCallback((message: string, options?: DialogOptions) => {
    return enqueueDialog('confirm', message, options).then((result) => Boolean(result));
  }, [enqueueDialog]);

  useEffect(() => {
    if (!activeDialog) return;

    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog(activeDialog.variant === 'confirm' ? false : undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDialog, closeDialog]);

  const contextValue = useMemo<AppDialogContextValue>(() => ({
    showAlert,
    showConfirm
  }), [showAlert, showConfirm]);

  const title = activeDialog?.title || (activeDialog?.variant === 'confirm' ? 'Please Confirm' : 'Notice');
  const confirmLabel = activeDialog?.confirmLabel || 'OK';
  const cancelLabel = activeDialog?.cancelLabel || 'Cancel';

  return (
    <AppDialogContext.Provider value={contextValue}>
      {children}

      {activeDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close dialog backdrop"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => closeDialog(activeDialog.variant === 'confirm' ? false : undefined)}
          />

          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`app-dialog-title-${activeDialog.id}`}
            className="relative w-full max-w-md rounded-2xl border border-white/20 bg-[#1e293b] p-8 shadow-2xl animate-scaleIn"
          >
            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => closeDialog(activeDialog.variant === 'confirm' ? false : undefined)}
              className="absolute right-4 top-4 rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-start gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                activeDialog.variant === 'confirm'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-primary-cyan/15 text-primary-cyan'
              }`}>
                {activeDialog.variant === 'confirm' ? <HelpCircle size={22} /> : <AlertCircle size={22} />}
              </div>

              <div className="min-w-0 flex-1 pr-8">
                <h2
                  id={`app-dialog-title-${activeDialog.id}`}
                  className="text-xl font-black text-white"
                >
                  {title}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-white/70">
                  {activeDialog.message}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {activeDialog.variant === 'confirm' && (
                <button
                  type="button"
                  onClick={() => closeDialog(false)}
                  className="flex-1 rounded-xl bg-black/20 px-4 py-3 text-sm font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => closeDialog(activeDialog.variant === 'confirm' ? true : undefined)}
                className="flex-1 rounded-xl bg-primary-cyan/80 px-4 py-3 text-sm font-black text-[#04131a] transition-colors hover:bg-primary-cyan disabled:opacity-50"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppDialogContext.Provider>
  );
};

export function useAppDialog() {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error('useAppDialog must be used within an AppDialogProvider');
  }
  return context;
}

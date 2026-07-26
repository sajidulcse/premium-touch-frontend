import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import './Toast.css';

const ToastContext = createContext();

let toastIdCounter = 0;

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

const ICONS = {
  success: 'fas fa-check-circle',
  error: 'fas fa-exclamation-circle',
  warning: 'fas fa-exclamation-triangle',
  info: 'fas fa-info-circle',
};

const Toast = ({ toast, onDismiss }) => {
  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 320);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 320);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`pt-toast pt-toast--${toast.type} ${exiting ? 'pt-toast--exit' : ''}`}>
      <div className="pt-toast__icon">
        <i className={ICONS[toast.type] || ICONS.info}></i>
      </div>
      <div className="pt-toast__body">
        <p className="pt-toast__message">{toast.msg}</p>
      </div>
      <button className="pt-toast__close" onClick={handleDismiss} aria-label="Close">
        <i className="fas fa-times"></i>
      </button>
      <div
        className="pt-toast__progress"
        style={{ animationDuration: `${toast.duration || 4000}ms` }}
      />
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, msg, duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev.slice(-4), { id, type, msg, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience methods
  const toast = React.useMemo(
    () => ({
      success: (msg, duration) => showToast('success', msg, duration),
      error: (msg, duration) => showToast('error', msg, duration),
      warning: (msg, duration) => showToast('warning', msg, duration),
      info: (msg, duration) => showToast('info', msg, duration),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pt-toast-container" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;

import { useState, useCallback, useEffect } from 'react';

// ── Types de toast ──
// success | error | warning | info

let toastId = 0;

// Singleton event emitter pour les toasts
const listeners = new Set();

export function toast(message, type = 'info', duration = 4000) {
  const id = ++toastId;
  listeners.forEach(fn => fn({ id, message, type, duration }));
  return id;
}

toast.success = (msg, duration) => toast(msg, 'success', duration);
toast.error = (msg, duration) => toast(msg, 'error', duration || 6000);
toast.warning = (msg, duration) => toast(msg, 'warning', duration);
toast.info = (msg, duration) => toast(msg, 'info', duration);

// ── Icônes ──
function ToastIcon({ type }) {
  if (type === 'success') return (
    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (type === 'error') return (
    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
  if (type === 'warning') return (
    <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
  return (
    <svg className="w-5 h-5 text-cobilan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

// ── Composant Toast individuel ──
function ToastItem({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animation entrée
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleRemove = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  const borderColors = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-cobilan-500',
  };

  return (
    <div
      className={`flex items-start gap-3 bg-white border border-gray-200 border-l-4 ${borderColors[type]} rounded-xl shadow-lg px-4 py-3 max-w-sm w-full transition-all duration-300 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <ToastIcon type={type} />
      <p className="text-sm text-gray-700 flex-1 leading-snug">{message}</p>
      <button onClick={handleRemove} className="text-gray-300 hover:text-gray-500 transition shrink-0 mt-0.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Conteneur principal ──
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (newToast) => {
      setToasts(prev => [...prev, newToast]);
      // Auto-remove après duration
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration);
    };

    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onRemove={remove} />
      ))}
    </div>
  );
}

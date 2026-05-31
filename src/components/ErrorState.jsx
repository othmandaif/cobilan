import { Component } from 'react';

// ── Composant ErrorState inline ──
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Une erreur est survenue</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-4">{message || 'Impossible de charger les données.'}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-cobilan-600 bg-cobilan-50 rounded-lg hover:bg-cobilan-100 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Réessayer
        </button>
      )}
    </div>
  );
}

// ── Error Boundary React ──
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Quelque chose s'est mal passé</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Une erreur inattendue s'est produite. Veuillez rafraîchir la page.
          </p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2.5 text-sm font-semibold bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 transition">
            Rafraîchir la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Hook pour parser les erreurs ERPNext ──
export function parseERPNextError(err) {
  const serverMessages = err.response?.data?._server_messages;
  if (serverMessages) {
    try {
      const parsed = JSON.parse(serverMessages);
      const first = JSON.parse(parsed[0]);
      return first.message || 'Erreur ERPNext';
    } catch {
      return 'Erreur ERPNext';
    }
  }
  return err.response?.data?.message || err.message || 'Erreur inconnue';
}

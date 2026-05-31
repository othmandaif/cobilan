// ── Utilitaires partagés pour les rapports ──

export function formatMAD(amount) {
  if (amount == null || amount === '') return '';
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function firstDayOfYear() {
  return new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
}

// ── Composant ReportTable générique ──
export function ReportTable({ columns, rows, loading, emptyMessage = 'Aucune donnée' }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col, i) => (
                <th key={i}
                  className={`px-4 py-3 font-medium text-gray-500 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, ri) => (
              <tr key={ri} className={`${row._bold ? 'font-semibold bg-gray-50/80' : 'hover:bg-gray-50/30'}`}>
                {columns.map((col, ci) => {
                  const val = row[col.key];
                  return (
                    <td key={ci}
                      className={`px-4 py-2 ${col.align === 'right' ? 'text-right font-mono' : 'text-left'} ${col.colorize && Number(val) > 0 ? col.positiveColor || 'text-cobilan-700' : col.colorize && Number(val) < 0 ? col.negativeColor || 'text-red-600' : 'text-gray-700'}`}>
                      {col.type === 'currency' ? formatMAD(val) :
                       col.type === 'date' ? formatDate(val) :
                       (val ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Composant EmptyState ──
export function EmptyState({ message }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
      <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Composant FilterBar ──
export function FilterBar({ children, onRun, loading, disabled }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {children}
        </div>
        <button onClick={onRun} disabled={loading || disabled}
          className="px-5 py-2.5 text-sm font-semibold bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition whitespace-nowrap flex items-center gap-2">
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          )}
          {loading ? 'Chargement…' : 'Générer'}
        </button>
      </div>
    </div>
  );
}

export const labelCls = "block text-xs font-medium text-gray-600 mb-1";
export const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500";

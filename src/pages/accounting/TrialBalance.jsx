import { useState, useEffect } from 'react';
import accountingService from '../../api/accounting';

import Pagination from '../../components/Pagination';

function formatMAD(amount) {
  if (!amount && amount !== 0) return '';
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export default function TrialBalance({ company, fiscalYear }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showZero, setShowZero] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadBalance = async () => {
    if (!company || !fiscalYear) return;
    setLoading(true);
    setError('');
    try {
      const result = await accountingService.getTrialBalance({
        company,
        fiscalYear,
        showZeroValues: showZero ? 1 : 0,
      });
      setData(result);
    } catch (err) {
      setError('Erreur lors du chargement de la balance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const rows = data?.result || [];
  const totalPages = Math.ceil(rows.length / limit);
  const displayRows = rows.slice(page * limit, (page + 1) * limit);
  const columns = data?.columns || [];

  // Colonnes clés de la balance
  const KEY_COLS = ['account', 'account_name', 'opening_debit', 'opening_credit', 'debit', 'credit', 'closing_debit', 'closing_credit'];
  const COL_LABELS = {
    account: 'N° Compte',
    account_name: 'Nom',
    opening_debit: 'Solde ouv. D',
    opening_credit: 'Solde ouv. C',
    debit: 'Mouv. Débit',
    credit: 'Mouv. Crédit',
    closing_debit: 'Solde clôt. D',
    closing_credit: 'Solde clôt. C',
  };
  const NUMERIC_COLS = ['opening_debit', 'opening_credit', 'debit', 'credit', 'closing_debit', 'closing_credit'];

  const visibleCols = columns.filter(c => {
    const key = typeof c === 'object' ? c.fieldname : c;
    return KEY_COLS.includes(key);
  });

  const getCellValue = (row, col) => {
    const key = typeof c === 'object' ? c.fieldname : col;
    return row[typeof col === 'object' ? col.fieldname : col];
  };

  const isNumeric = (col) => NUMERIC_COLS.includes(typeof col === 'object' ? col.fieldname : col);
  const getLabel = (col) => {
    const key = typeof col === 'object' ? col.fieldname : col;
    return COL_LABELS[key] || col.label || key;
  };

  // Calculer les totaux depuis les lignes
  const totals = NUMERIC_COLS.reduce((acc, key) => {
    acc[key] = rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    return acc;
  }, {});

  return (
    <div>
      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Balance des comptes</h3>
          <p className="text-xs text-gray-500">Exercice fiscal : <strong>{fiscalYear || '—'}</strong> · Société : <strong>{company || '—'}</strong></p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showZero} onChange={(e) => setShowZero(e.target.checked)}
              className="rounded border-gray-300 text-cobilan-600" />
            <span className="text-xs text-gray-600">Afficher soldes nuls</span>
          </label>
          <button onClick={loadBalance} disabled={loading || !company || !fiscalYear}
            className="px-4 py-2 text-sm font-medium bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition">
            {loading ? 'Chargement…' : 'Afficher'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
        </div>
      )}

      {!loading && data && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Balance — {rows.length} compte{rows.length > 1 ? 's' : ''}
            </h3>
          </div>
          {rows.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">Aucune donnée pour cet exercice</p>
          ) : (<>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Compte</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Solde Ouv. D</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Solde Ouv. C</th>
                    <th className="text-right px-4 py-3 font-medium text-cobilan-700">Mouv. Débit</th>
                    <th className="text-right px-4 py-3 font-medium text-red-600">Mouv. Crédit</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Solde Clôt. D</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Solde Clôt. C</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayRows.map((row, i) => {
                    const isGroup = row.is_group;
                    return (
                      <tr key={i} className={`${isGroup ? 'bg-gray-50/80 font-semibold' : 'hover:bg-gray-50/30'}`}>
                        <td className="px-4 py-2 font-mono text-gray-500">{row.account || ''}</td>
                        <td className={`px-4 py-2 ${isGroup ? 'text-gray-900' : 'text-gray-700'}`}>
                          {row.account_name || ''}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-500 hidden md:table-cell">
                          {formatMAD(row.opening_debit)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-500 hidden md:table-cell">
                          {formatMAD(row.opening_credit)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-cobilan-700">
                          {formatMAD(row.debit)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-red-600">
                          {formatMAD(row.credit)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-600 hidden lg:table-cell">
                          {formatMAD(row.closing_debit)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-600 hidden lg:table-cell">
                          {formatMAD(row.closing_credit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Ligne de total */}
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold text-xs">
                    <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                    <td className="px-4 py-3 text-right font-mono hidden md:table-cell">{formatMAD(totals.opening_debit)}</td>
                    <td className="px-4 py-3 text-right font-mono hidden md:table-cell">{formatMAD(totals.opening_credit)}</td>
                    <td className="px-4 py-3 text-right font-mono text-cobilan-700">{formatMAD(totals.debit)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">{formatMAD(totals.credit)}</td>
                    <td className="px-4 py-3 text-right font-mono hidden lg:table-cell">{formatMAD(totals.closing_debit)}</td>
                    <td className="px-4 py-3 text-right font-mono hidden lg:table-cell">{formatMAD(totals.closing_credit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={rows.length} limit={limit} onPageChange={setPage} />
          </>)}
        </div>
      )}

      {!loading && !data && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <p className="text-sm">Sélectionnez une société et un exercice fiscal puis cliquez sur Afficher</p>
        </div>
      )}
    </div>
  );
}

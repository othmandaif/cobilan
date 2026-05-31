import { useState, useEffect } from 'react';
import accountingService from '../../api/accounting';

import Pagination from '../../components/Pagination';

function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function firstDayOfYear() { return new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]; }

export default function GeneralLedger({ company }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);

  const [page, setPage] = useState(0);
  const limit = 20;

  const [filters, setFilters] = useState({
    fromDate: firstDayOfYear(),
    toDate: todayStr(),
    account: '',
    groupBy: 'Group by Voucher',
  });

  useEffect(() => {
    if (!company) return;
    accountingService.getAccounts({ company }).then(accs => {
      setAccounts(accs?.filter(a => !a.is_group) || []);
    }).catch(() => {});
  }, [company]);

  const loadLedger = async () => {
    if (!company) return;
    setLoading(true);
    setError('');
    try {
      const result = await accountingService.getGeneralLedger({
        company,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        account: filters.account,
        groupBy: filters.groupBy,
      });
      setData(result);
    } catch (err) {
      setError('Erreur lors du chargement du grand livre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const rows = data?.result || [];
  const totalPages = Math.ceil(rows.length / limit);
  const displayRows = rows.slice(page * limit, (page + 1) * limit);
  const columns = data?.columns || [];

  // Colonnes utiles à afficher
  const COL_MAP = {
    'posting_date': 'Date',
    'voucher_no': 'Pièce',
    'account': 'Compte',
    'party': 'Tiers',
    'debit': 'Débit',
    'credit': 'Crédit',
    'balance': 'Solde',
    'remarks': 'Libellé',
  };

  const visibleCols = columns.filter(c => {
    const key = typeof c === 'object' ? c.fieldname : c;
    return Object.keys(COL_MAP).includes(key);
  });

  const getCellValue = (row, col) => {
    const key = typeof col === 'object' ? col.fieldname : col;
    return row[key];
  };

  const isNumericCol = (col) => {
    const key = typeof col === 'object' ? col.fieldname : col;
    return ['debit', 'credit', 'balance'].includes(key);
  };

  const isDateCol = (col) => {
    const key = typeof col === 'object' ? col.fieldname : col;
    return key === 'posting_date';
  };

  const getColLabel = (col) => {
    const key = typeof col === 'object' ? col.fieldname : col;
    return COL_MAP[key] || col.label || key;
  };

  return (
    <div>
      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Paramètres du grand livre</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Du</label>
            <input type="date" value={filters.fromDate}
              onChange={(e) => setFilters(p => ({ ...p, fromDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Au</label>
            <input type="date" value={filters.toDate}
              onChange={(e) => setFilters(p => ({ ...p, toDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Compte (optionnel)</label>
            <select value={filters.account}
              onChange={(e) => setFilters(p => ({ ...p, account: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500">
              <option value="">— Tous les comptes —</option>
              {accounts.map(a => (
                <option key={a.name} value={a.name}>
                  {a.account_number ? `${a.account_number} - ` : ''}{a.account_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Regrouper par</label>
            <div className="flex gap-2">
              <select value={filters.groupBy}
                onChange={(e) => setFilters(p => ({ ...p, groupBy: e.target.value }))}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500">
                <option value="Group by Voucher">Pièce</option>
                <option value="Group by Account">Compte</option>
                <option value="Group by Party">Tiers</option>
              </select>
              <button onClick={loadLedger} disabled={loading}
                className="px-4 py-2 text-sm font-medium bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition whitespace-nowrap">
                {loading ? '…' : 'Afficher'}
              </button>
            </div>
          </div>
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
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Grand Livre — {rows.length} ligne{rows.length > 1 ? 's' : ''}
            </h3>
            <p className="text-xs text-gray-400">
              {filters.fromDate} → {filters.toDate}
            </p>
          </div>
          {rows.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">Aucune écriture pour cette période</p>
          ) : (<>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {visibleCols.map((col, i) => (
                      <th key={i}
                        className={`px-4 py-3 font-medium text-gray-500 ${isNumericCol(col) ? 'text-right' : 'text-left'}`}>
                        {getColLabel(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayRows.map((row, ri) => {
                    // Les lignes de total/groupe ont souvent account vide ou bold
                    const isTotal = !row.posting_date && !row.voucher_no;
                    return (
                      <tr key={ri} className={`${isTotal ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50/50'}`}>
                        {visibleCols.map((col, ci) => {
                          const val = getCellValue(row, col);
                          return (
                            <td key={ci}
                              className={`px-4 py-2 ${isNumericCol(col) ? 'text-right font-mono' : 'text-left'} ${
                                typeof col === 'object' && col.fieldname === 'balance'
                                  ? Number(val) < 0 ? 'text-red-600' : 'text-cobilan-700'
                                  : 'text-gray-700'
                              }`}>
                              {isNumericCol(col)
                                ? (val != null && val !== '' ? formatMAD(val) : '')
                                : isDateCol(col)
                                ? formatDate(val)
                                : (val || '')
                              }
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={rows.length} limit={limit} onPageChange={setPage} />
          </>)}
        </div>
      )}

      {!loading && !data && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-sm">Définissez vos paramètres et cliquez sur Afficher</p>
        </div>
      )}
    </div>
  );
}

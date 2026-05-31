import { useState } from 'react';
import reportsService from '../../api/reports';
import Pagination from '../../components/Pagination';
import { formatMAD, formatDate, firstDayOfYear, todayStr, FilterBar, labelCls, inputCls, EmptyState } from './reportUtils';

// ── Composant générique pour les registres ──
function RegisterReport({ company, title, fetchFn, keyMap }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState(firstDayOfYear());
  const [toDate, setToDate] = useState(todayStr());
  const [page, setPage] = useState(0);
  const limit = 20;

  const run = async () => {
    if (!company) return;
    setLoading(true); setError('');
    try {
      const result = await fetchFn({ company, fromDate, toDate });
      setData(result);
    } catch { setError(`Erreur lors du chargement du ${title}`); }
    finally { setLoading(false); }
  };

  const rows = (data?.result || []).filter(r => r[keyMap.party] || r[keyMap.voucher]);
  const totalPages = Math.ceil(rows.length / limit);
  const displayRows = rows.slice(page * limit, (page + 1) * limit);

  const total = rows.reduce((s, r) => s + (Number(r[keyMap.amount]) || 0), 0);
  const totalTax = rows.reduce((s, r) => s + (Number(r[keyMap.tax]) || 0), 0);

  return (
    <div>
      <FilterBar onRun={run} loading={loading} disabled={!company}>
        <div>
          <label className={labelCls}>Du</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Au</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Société</label>
          <p className="text-sm font-medium text-gray-700 py-2">{company || '—'}</p>
        </div>
      </FilterBar>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!data && !loading && <EmptyState message={`Cliquez sur Générer pour afficher le ${title}`} />}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Nombre de factures</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{rows.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total HT</p>
              <p className="text-lg font-bold text-cobilan-700 mt-1">{formatMAD(total)} MAD</p>
            </div>
            {totalTax > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Total Taxes</p>
                <p className="text-lg font-bold text-orange-600 mt-1">{formatMAD(totalTax)} MAD</p>
              </div>
            )}
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                {title} — {rows.length} entrée{rows.length > 1 ? 's' : ''}
              </h3>
            </div>
            {rows.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">Aucune facture sur cette période</p>
            ) : (<>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">N° Facture</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">{keyMap.partyLabel}</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Montant HT</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Taxes</th>
                      <th className="text-right px-4 py-3 font-medium text-cobilan-700">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {displayRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/30">
                        <td className="px-4 py-2 font-medium text-cobilan-600">{row[keyMap.voucher] || '—'}</td>
                        <td className="px-4 py-2 text-gray-700">{row[keyMap.party] || '—'}</td>
                        <td className="px-4 py-2 text-gray-500 hidden md:table-cell">{formatDate(row.posting_date || row.date)}</td>
                        <td className="px-4 py-2 text-right font-mono text-gray-700">{formatMAD(row[keyMap.amount])}</td>
                        <td className="px-4 py-2 text-right font-mono text-orange-500 hidden sm:table-cell">{formatMAD(row[keyMap.tax])}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold text-cobilan-700">{formatMAD(row[keyMap.grandTotal])}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                      <td className="px-4 py-3" colSpan={3}>TOTAL</td>
                      <td className="px-4 py-3 text-right font-mono">{formatMAD(total)}</td>
                      <td className="px-4 py-3 text-right font-mono text-orange-500 hidden sm:table-cell">{formatMAD(totalTax)}</td>
                      <td className="px-4 py-3 text-right font-mono text-cobilan-700">{formatMAD(total + totalTax)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} total={rows.length} limit={limit} onPageChange={setPage} />
            </>)}
          </div>
        </>
      )}
    </div>
  );
}

// ── Registre des ventes ──
export function SalesRegisterReport({ company }) {
  return (
    <RegisterReport
      company={company}
      title="Registre des ventes"
      fetchFn={reportsService.getSalesRegister}
      keyMap={{
        voucher: 'invoice',
        party: 'customer',
        partyLabel: 'Client',
        amount: 'net_total',
        tax: 'tax_amount',
        grandTotal: 'grand_total',
      }}
    />
  );
}

// ── Registre des achats ──
export function PurchaseRegisterReport({ company }) {
  return (
    <RegisterReport
      company={company}
      title="Registre des achats"
      fetchFn={reportsService.getPurchaseRegister}
      keyMap={{
        voucher: 'invoice',
        party: 'supplier',
        partyLabel: 'Fournisseur',
        amount: 'net_total',
        tax: 'tax_amount',
        grandTotal: 'grand_total',
      }}
    />
  );
}



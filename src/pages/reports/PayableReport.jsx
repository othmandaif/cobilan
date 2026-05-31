import { useState } from 'react';
import reportsService from '../../api/reports';
import Pagination from '../../components/Pagination';
import { formatMAD, formatDate, todayStr, FilterBar, labelCls, inputCls, EmptyState } from './reportUtils';

export default function PayableReport({ company }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reportDate, setReportDate] = useState(todayStr());
  const [page, setPage] = useState(0);
  const limit = 20;

  const run = async () => {
    if (!company) return;
    setLoading(true); setError('');
    try {
      const result = await reportsService.getAccountsPayable({ company, reportDate });
      setData(result);
    } catch { setError('Erreur lors du chargement'); }
    finally { setLoading(false); }
  };

  const rows = data?.result || [];
  const dataRows = rows.filter(r => r.party || r.voucher_no);
  const totalPages = Math.ceil(dataRows.length / limit);
  const displayRows = dataRows.slice(page * limit, (page + 1) * limit);

  const totals = dataRows.reduce((acc, row) => {
    acc.outstanding = (acc.outstanding || 0) + (Number(row.outstanding) || 0);
    acc.range1 = (acc.range1 || 0) + (Number(row.range1) || 0);
    acc.range2 = (acc.range2 || 0) + (Number(row.range2) || 0);
    acc.range3 = (acc.range3 || 0) + (Number(row.range3) || 0);
    acc.range4 = (acc.range4 || 0) + (Number(row.range4) || 0);
    return acc;
  }, {});

  return (
    <div>
      <FilterBar onRun={run} loading={loading} disabled={!company}>
        <div>
          <label className={labelCls}>Date du rapport</label>
          <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Société</label>
          <p className="text-sm font-medium text-gray-700 py-2">{company || '—'}</p>
        </div>
      </FilterBar>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!data && !loading && <EmptyState message="Cliquez sur Générer pour afficher la balance âgée fournisseurs" />}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total dettes', value: totals.outstanding, color: 'text-gray-900' },
              { label: '0–30 jours', value: totals.range1, color: 'text-green-600' },
              { label: '31–60 jours', value: totals.range2, color: 'text-orange-600' },
              { label: '+ 60 jours', value: (totals.range3 || 0) + (totals.range4 || 0), color: 'text-red-600' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{formatMAD(kpi.value)} MAD</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Balance âgée fournisseurs</h3>
            </div>
            {dataRows.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">Aucune dette fournisseur en attente</p>
            ) : (<>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Fournisseur</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Facture</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Échéance</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Encours</th>
                      <th className="text-right px-4 py-3 font-medium text-green-600 hidden sm:table-cell">0–30j</th>
                      <th className="text-right px-4 py-3 font-medium text-orange-500 hidden sm:table-cell">31–60j</th>
                      <th className="text-right px-4 py-3 font-medium text-red-500 hidden lg:table-cell">61–90j</th>
                      <th className="text-right px-4 py-3 font-medium text-red-700 hidden lg:table-cell">+90j</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {displayRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/30">
                        <td className="px-4 py-2 font-medium text-gray-900">{row.party || row.supplier_name || '—'}</td>
                        <td className="px-4 py-2 text-cobilan-600 hidden md:table-cell">{row.voucher_no || '—'}</td>
                        <td className="px-4 py-2 text-gray-500 hidden md:table-cell">{formatDate(row.due_date)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900 font-mono">{formatMAD(row.outstanding)}</td>
                        <td className="px-4 py-2 text-right text-green-600 font-mono hidden sm:table-cell">{formatMAD(row.range1)}</td>
                        <td className="px-4 py-2 text-right text-orange-500 font-mono hidden sm:table-cell">{formatMAD(row.range2)}</td>
                        <td className="px-4 py-2 text-right text-red-500 font-mono hidden lg:table-cell">{formatMAD(row.range3)}</td>
                        <td className="px-4 py-2 text-right text-red-700 font-mono hidden lg:table-cell">{formatMAD(row.range4)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                      <td className="px-4 py-3" colSpan={3}>TOTAL</td>
                      <td className="px-4 py-3 text-right font-mono">{formatMAD(totals.outstanding)}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-mono hidden sm:table-cell">{formatMAD(totals.range1)}</td>
                      <td className="px-4 py-3 text-right text-orange-500 font-mono hidden sm:table-cell">{formatMAD(totals.range2)}</td>
                      <td className="px-4 py-3 text-right text-red-500 font-mono hidden lg:table-cell">{formatMAD(totals.range3)}</td>
                      <td className="px-4 py-3 text-right text-red-700 font-mono hidden lg:table-cell">{formatMAD(totals.range4)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} total={dataRows.length} limit={limit} onPageChange={setPage} />
            </>)}
          </div>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import reportsService from '../../api/reports';
import Pagination from '../../components/Pagination';
import { formatMAD, FilterBar, labelCls, inputCls, EmptyState } from './reportUtils';

export default function BalanceSheetReport({ company, fiscalYear }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [periodicity, setPeriodicity] = useState('Yearly');
  const [page, setPage] = useState(0);
  const limit = 20;

  const run = async () => {
    if (!company || !fiscalYear) return;
    setLoading(true); setError('');
    try {
      const result = await reportsService.getBalanceSheet({ company, fiscalYear, periodicity });
      setData(result);
    } catch { setError('Erreur lors du chargement du bilan'); }
    finally { setLoading(false); }
  };

  const rows = data?.result || [];
  const totalPages = Math.ceil(rows.length / limit);
  const displayRows = rows.slice(page * limit, (page + 1) * limit);
  const columns = data?.columns || [];

  const displayCols = columns.filter(c => {
    const key = typeof c === 'object' ? c.fieldname : c;
    return !['indent', 'parent_account', 'account_type', 'is_group'].includes(key);
  });

  const getCellValue = (row, col) => row[typeof col === 'object' ? col.fieldname : col];
  const getLabel = (col) => typeof col === 'object' ? (col.label || col.fieldname) : col;

  return (
    <div>
      <FilterBar onRun={run} loading={loading} disabled={!company || !fiscalYear}>
        <div>
          <label className={labelCls}>Périodicité</label>
          <select value={periodicity} onChange={(e) => setPeriodicity(e.target.value)} className={inputCls}>
            <option value="Yearly">Annuelle</option>
            <option value="Half-Yearly">Semestrielle</option>
            <option value="Quarterly">Trimestrielle</option>
            <option value="Monthly">Mensuelle</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Exercice fiscal</label>
          <p className="text-sm font-medium text-gray-700 py-2">{fiscalYear || '—'}</p>
        </div>
        <div>
          <label className={labelCls}>Société</label>
          <p className="text-sm font-medium text-gray-700 py-2">{company || '—'}</p>
        </div>
      </FilterBar>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!data && !loading && <EmptyState message="Cliquez sur Générer pour afficher le bilan" />}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
        </div>
      )}

      {!loading && data && rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Bilan — {fiscalYear}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {displayCols.map((col, i) => (
                    <th key={i}
                      className={`px-4 py-3 font-medium text-gray-500 ${i === 0 ? 'text-left' : 'text-right'}`}>
                      {getLabel(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayRows.map((row, ri) => {
                  const isHeader = row.indent === 0 || row.is_group;
                  const isTotal = String(row.account || '').toLowerCase().includes('total');
                  return (
                    <tr key={ri} className={`${isTotal ? 'bg-cobilan-50 font-bold border-t border-cobilan-200' : isHeader ? 'bg-gray-50/80 font-semibold' : 'hover:bg-gray-50/30'}`}>
                      {displayCols.map((col, ci) => {
                        const val = getCellValue(row, col);
                        const isNum = typeof val === 'number';
                        const indent = ci === 0 ? (row.indent || 0) * 16 : 0;
                        return (
                          <td key={ci}
                            className={`px-4 py-2 ${ci === 0 ? 'text-left text-gray-800' : 'text-right font-mono'} ${
                              isNum && val < 0 ? 'text-red-600' :
                              isNum && val > 0 && ci > 0 ? 'text-cobilan-700' : 'text-gray-700'
                            }`}
                            style={ci === 0 ? { paddingLeft: `${16 + indent}px` } : {}}>
                            {isNum ? formatMAD(val) : (val || '')}
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
        </div>
      )}
    </div>
  );
}

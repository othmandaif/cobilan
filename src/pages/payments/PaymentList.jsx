import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import paymentService from '../../api/payments';
import ConfirmModal from '../../components/ConfirmModal';
import ExportButton from '../../components/ExportButton';

function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0) + ' MAD';
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const FILTERS = [
  { label: 'Tous', value: '' },
  { label: 'Encaissements', value: 'Receive' },
  { label: 'Décaissements', value: 'Pay' },
];

export default function PaymentList() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, count] = await Promise.all([
        paymentService.getAll({ page, limit, paymentType: typeFilter }),
        paymentService.getCount({ paymentType: typeFilter }),
      ]);
      setPayments(data || []);
      setTotal(count || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await paymentService.delete(deleteTarget);
      setDeleteTarget(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Impossible de supprimer');
    } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Paiements</h1>
          <p className="mt-1 text-sm text-gray-500">{total} paiement{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            doctype="Payment Entry"
            fields={['name', 'payment_type', 'party', 'paid_amount', 'posting_date']}
            filename="paiements.csv"
          />
          <button onClick={() => navigate('/paiements/nouveau')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cobilan-600 text-white text-sm font-semibold rounded-lg hover:bg-cobilan-700 transition active:scale-[0.98]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouveau paiement
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => { setTypeFilter(f.value); setPage(0); }}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition ${typeFilter === f.value ? 'bg-cobilan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">Aucun paiement</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Paiement</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Tiers</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Montant</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Statut</th>
                  <th className="text-right px-5 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/paiements/${encodeURIComponent(p.name)}`}
                        className="font-medium text-cobilan-600 hover:text-cobilan-800">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.payment_type === 'Receive' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <span>{p.payment_type === 'Receive' ? '↓ Encaissement' : '↑ Décaissement'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700 hidden md:table-cell">{p.party_name || p.party || '—'}</td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{formatDate(p.posting_date)}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${p.payment_type === 'Receive' ? 'text-green-600' : 'text-red-600'}`}>
                      {p.payment_type === 'Receive' ? '+' : '-'}{formatMAD(p.paid_amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.docstatus === 1 ? 'bg-green-50 text-green-700' :
                        p.docstatus === 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {p.docstatus === 1 ? 'Soumis' : p.docstatus === 0 ? 'Brouillon' : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {p.docstatus === 0 && (
                        <button onClick={() => setDeleteTarget(p.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{page * limit + 1}–{Math.min((page + 1) * limit, total)} sur {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">Précédent</button>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">Suivant</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal open={!!deleteTarget} title="Supprimer ce paiement ?"
        message="Seuls les brouillons peuvent être supprimés."
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'} danger
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import invoiceService from '../../api/invoices';
import ConfirmModal from '../../components/ConfirmModal';
import { TableSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';
import { toast } from '../../components/toast';
import { parseERPNextError } from '../../components/ErrorState';
import ExportButton from '../../components/ExportButton';

function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0) + ' MAD';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const styles = {
    Draft: 'bg-gray-100 text-gray-600',
    Submitted: 'bg-blue-50 text-blue-700',
    Paid: 'bg-green-50 text-green-700',
    Unpaid: 'bg-orange-50 text-orange-700',
    Overdue: 'bg-red-50 text-red-700',
    'Partly Paid': 'bg-yellow-50 text-yellow-700',
    Cancelled: 'bg-gray-100 text-gray-400',
    'Return': 'bg-purple-50 text-purple-700',
  };
  const labels = {
    Draft: 'Brouillon',
    Submitted: 'Soumise',
    Paid: 'Payée',
    Unpaid: 'Impayée',
    Overdue: 'En retard',
    'Partly Paid': 'Partielle',
    Cancelled: 'Annulée',
    'Return': 'Avoir',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}

const STATUS_FILTERS = [
  { label: 'Toutes', value: '' },
  { label: 'Brouillon', value: 'Draft' },
  { label: 'Impayées', value: 'Unpaid' },
  { label: 'En retard', value: 'Overdue' },
  { label: 'Partielles', value: 'Partly Paid' },
  { label: 'Payées', value: 'Paid' },
  { label: 'Annulées', value: 'Cancelled' },
];

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const [data, count] = await Promise.all([
        invoiceService.getAll({ page, limit, status: statusFilter, search }),
        invoiceService.getCount({ status: statusFilter }),
      ]);
      setInvoices(data || []);
      setTotal(count || 0);
    } catch (err) {
      toast.error('Impossible de charger les factures');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Debounce recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await invoiceService.delete(deleteTarget);
      setDeleteTarget(null);
      toast.success('Facture supprimée avec succès');
      loadInvoices();
    } catch (err) {
      toast.error(parseERPNextError(err) || 'Impossible de supprimer cette facture.');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Factures de vente</h1>
          <p className="mt-1 text-sm text-gray-500">{total} facture{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            doctype="Sales Invoice"
            fields={['name', 'customer', 'posting_date', 'grand_total', 'outstanding_amount', 'status']}
            filename="factures-vente.csv"
          />
          <button
            onClick={() => navigate('/factures-vente/nouvelle')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cobilan-600 text-white text-sm font-semibold rounded-lg hover:bg-cobilan-700 transition active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouvelle facture
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher (client, n° facture)…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(0); }}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition ${
                statusFilter === f.value
                  ? 'bg-cobilan-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={search || statusFilter ? 'search' : 'invoices'}
            title={search || statusFilter ? 'Aucune facture trouvée' : 'Aucune facture enregistrée'}
            description={search || statusFilter ? 'Modifiez vos filtres ou votre recherche.' : 'Commencez par créer votre première facture de vente.'}
            action={!(search || statusFilter) ? () => navigate('/factures-vente/nouvelle') : undefined}
            actionLabel="Créer une facture"
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Facture</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Échéance</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Reste dû</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Statut</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <Link to={`/factures-vente/${encodeURIComponent(inv.name)}`} className="font-medium text-cobilan-600 hover:text-cobilan-800">
                        {inv.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-900">{inv.customer_name || inv.customer}</td>
                    <td className="px-6 py-3 text-gray-600 hidden md:table-cell">{formatDate(inv.posting_date)}</td>
                    <td className="px-6 py-3 text-gray-600 hidden lg:table-cell">{formatDate(inv.due_date)}</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">{formatMAD(inv.grand_total)}</td>
                    <td className="px-6 py-3 text-right hidden md:table-cell">
                      <span className={`font-medium ${(inv.outstanding_amount || 0) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {formatMAD(inv.outstanding_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* PDF */}
                        
                        <button
                          onClick={() => window.open(invoiceService.getPdfUrl(inv.name), '_blank')}
                          className="p-1.5 text-gray-400 hover:text-cobilan-600 rounded-lg hover:bg-cobilan-50 transition"
                          title="Télécharger PDF"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                        {/* Supprimer (Draft uniquement) */}
                        {inv.docstatus === 0 && (
                          <button
                            onClick={() => setDeleteTarget(inv.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {page * limit + 1}–{Math.min((page + 1) * limit, total)} sur {total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Supprimer cette facture ?"
        message="Seules les factures en brouillon peuvent être supprimées. Cette action est irréversible."
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
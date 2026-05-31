import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import invoiceService from '../../api/invoices';
import ConfirmModal from '../../components/ConfirmModal';
import { PageLoader } from '../../components/skeletons';
import { toast } from '../../components/toast';
import { parseERPNextError } from '../../components/ErrorState';
import ActivityTimeline from '../../components/ActivityTimeline';

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
    month: 'long',
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
  };
  const labels = {
    Draft: 'Brouillon',
    Submitted: 'Soumise',
    Paid: 'Payée',
    Unpaid: 'Impayée',
    Overdue: 'En retard',
    'Partly Paid': 'Partielle',
    Cancelled: 'Annulée',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getById(id);
      setInvoice(data);
    } catch {
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setActionLoading('submit');
    try {
      await invoiceService.submit(id);
      toast.success('Facture soumise avec succès');
      setShowSubmit(false);
      loadInvoice();
    } catch (err) {
      toast.error(parseERPNextError(err) || 'Erreur lors de la soumission');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    try {
      await invoiceService.cancel(id);
      toast.success('Facture annulée avec succès');
      setShowCancel(false);
      loadInvoice();
    } catch (err) {
      toast.error(parseERPNextError(err) || "Erreur lors de l'annulation");
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async () => {
    setActionLoading('delete');
    try {
      await invoiceService.delete(id);
      toast.success('Facture supprimée avec succès');
      navigate('/factures-vente');
    } catch (err) {
      toast.error(parseERPNextError(err) || 'Impossible de supprimer cette facture.');
    } finally {
      setActionLoading('');
      setShowDelete(false);
    }
  };

  if (loading) return <PageLoader message="Chargement de la facture…" />;

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Facture introuvable</p>
        <Link to="/factures-vente" className="mt-4 inline-block text-sm text-cobilan-600 hover:underline">
          Retour aux factures
        </Link>
      </div>
    );
  }

  const isDraft = invoice.docstatus === 0;
  const isSubmitted = invoice.docstatus === 1;
  const items = invoice.items || [];
  const taxes = invoice.taxes || [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate('/factures-vente')}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition mb-2 tooltip-icon"
            aria-label="Retour"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{invoice.name}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{invoice.customer_name}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Télécharger PDF */}
          <button
            onClick={() => window.open(invoiceService.getPdfUrl(invoice.name), '_blank')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition flex items-center gap-2 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </button>

          {/* Modifier (Draft) */}
          {isDraft && (
            <button
              onClick={() => navigate(`/factures-vente/${encodeURIComponent(id)}/modifier`)}
              className="px-4 py-2 text-sm font-medium text-cobilan-700 bg-cobilan-50 rounded-xl hover:bg-cobilan-100 transition active:scale-[0.98]"
            >
              Modifier
            </button>
          )}

          {/* Soumettre (Draft) */}
          {isDraft && (
            <button
              onClick={() => setShowSubmit(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20 transition active:scale-[0.98]"
            >
              Soumettre
            </button>
          )}

          {/* Annuler (Submitted) */}
          {isSubmitted && invoice.status !== 'Cancelled' && (
            <button
              onClick={() => setShowCancel(true)}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition active:scale-[0.98]"
            >
              Annuler
            </button>
          )}

          {/* Supprimer (Draft) */}
          {isDraft && (
            <button
              onClick={() => setShowDelete(true)}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition active:scale-[0.98]"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Infos */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations</h3>
            <dl className="space-y-3">
              <InfoRow label="Client" value={invoice.customer_name} />
              <InfoRow label="Date facture" value={formatDate(invoice.posting_date)} />
              <InfoRow label="Date échéance" value={formatDate(invoice.due_date)} />
              <InfoRow label="Devise" value={invoice.currency || 'MAD'} />
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Montants</h3>
            <dl className="space-y-3">
              <InfoRow label="Sous-total HT" value={formatMAD(invoice.net_total)} />
              <InfoRow label="Taxes" value={formatMAD(invoice.total_taxes_and_charges)} />
              <div className="pt-2 border-t border-gray-100">
                <InfoRow label="Total TTC" value={formatMAD(invoice.grand_total)} bold />
              </div>
              {invoice.outstanding_amount > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Reste à payer</dt>
                    <dd className="text-sm font-bold text-orange-600">{formatMAD(invoice.outstanding_amount)}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Lignes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Articles */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Lignes de facture ({items.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Article</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Qté</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Prix unitaire</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">{item.item_name || item.item_code}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-900">{item.qty}</td>
                      <td className="px-6 py-3 text-right text-gray-900">{formatMAD(item.rate)}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">{formatMAD(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Taxes */}
          {taxes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Taxes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Description</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Taux</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {taxes.map((tax, i) => (
                      <tr key={i}>
                        <td className="px-6 py-3 text-gray-900">{tax.description || tax.account_head}</td>
                        <td className="px-6 py-3 text-right text-gray-900">{tax.rate}%</td>
                        <td className="px-6 py-3 text-right font-medium text-gray-900">{formatMAD(tax.tax_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-1">
          <ActivityTimeline doctype="Sales Invoice" name={id} />
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        open={showSubmit}
        title="Soumettre cette facture ?"
        message="Une fois soumise, la facture sera comptabilisée et ne pourra plus être modifiée. Vous pourrez toujours l'annuler si nécessaire."
        confirmLabel={actionLoading === 'submit' ? 'Soumission…' : 'Soumettre'}
        onConfirm={handleSubmit}
        onCancel={() => setShowSubmit(false)}
      />
      <ConfirmModal
        open={showCancel}
        title="Annuler cette facture ?"
        message="L'annulation créera une écriture comptable inverse. Cette action est irréversible."
        confirmLabel={actionLoading === 'cancel' ? 'Annulation…' : 'Annuler la facture'}
        danger
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />
      <ConfirmModal
        open={showDelete}
        title="Supprimer cette facture ?"
        message="Cette action est irréversible."
        confirmLabel={actionLoading === 'delete' ? 'Suppression…' : 'Supprimer'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

function InfoRow({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-sm text-gray-900 ${bold ? 'font-bold text-base' : 'font-medium'}`}>{value || '—'}</dd>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import paymentService from '../../api/payments';
import ConfirmModal from '../../components/ConfirmModal';

function formatMAD(a) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(a || 0) + ' MAD';
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value || '—'}</dd>
    </div>
  );
}

export default function PaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getById(id);
      setPayment(data);
    } catch { setPayment(null); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await paymentService.cancel(id);
      setShowCancel(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur annulation');
    } finally { setCancelling(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
    </div>
  );

  if (!payment) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Paiement introuvable</p>
      <Link to="/paiements" className="mt-4 inline-block text-sm text-cobilan-600 hover:underline">Retour</Link>
    </div>
  );

  const isReceive = payment.payment_type === 'Receive';
  const refs = payment.references || [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate('/paiements')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Paiements
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{payment.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              isReceive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {isReceive ? '↓ Encaissement' : '↑ Décaissement'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              payment.docstatus === 1 ? 'bg-cobilan-50 text-cobilan-700' :
              payment.docstatus === 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-500'
            }`}>
              {payment.docstatus === 1 ? 'Soumis' : payment.docstatus === 0 ? 'Brouillon' : 'Annulé'}
            </span>
          </div>
        </div>
        {payment.docstatus === 1 && (
          <button onClick={() => setShowCancel(true)}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition">
            Annuler
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations</h3>
            <dl className="space-y-3">
              <InfoRow label="Société" value={payment.company} />
              <InfoRow label="Tiers" value={payment.party_name || payment.party} />
              <InfoRow label="Type tiers" value={payment.party_type} />
              <InfoRow label="Date" value={formatDate(payment.posting_date)} />
              <InfoRow label="Mode" value={payment.mode_of_payment} />
              <InfoRow label="Référence" value={payment.reference_no} />
              <InfoRow label="Date référence" value={formatDate(payment.reference_date)} />
            </dl>
          </div>

          <div className={`rounded-xl border p-5 ${isReceive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs font-medium text-gray-500 mb-1">Montant</p>
            <p className={`text-3xl font-bold ${isReceive ? 'text-green-700' : 'text-red-700'}`}>
              {isReceive ? '+' : '-'}{formatMAD(payment.paid_amount)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Comptes</h3>
            <dl className="space-y-2">
              <InfoRow label="Compte débit" value={payment.paid_to} />
              <InfoRow label="Compte crédit" value={payment.paid_from} />
            </dl>
          </div>
        </div>

        {/* Lettrage */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Lettrage ({refs.length} facture{refs.length > 1 ? 's' : ''})
              </h3>
            </div>
            {refs.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Aucune facture lettrée</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Facture</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Montant alloué</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {refs.map((ref, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-cobilan-600">{ref.reference_name}</td>
                        <td className="px-6 py-3 text-gray-500">{ref.reference_doctype}</td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-900">{formatMAD(ref.allocated_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                      <td className="px-6 py-3" colSpan={2}>Total alloué</td>
                      <td className="px-6 py-3 text-right">{formatMAD(refs.reduce((s, r) => s + (r.allocated_amount || 0), 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal open={showCancel} title="Annuler ce paiement ?"
        message="L'annulation créera une écriture comptable inverse. Les factures lettrées redeviendront impayées."
        confirmLabel={cancelling ? 'Annulation…' : 'Annuler le paiement'} danger
        onConfirm={handleCancel} onCancel={() => setShowCancel(false)} />
    </div>
  );
}

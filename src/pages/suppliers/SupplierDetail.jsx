import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import supplierService from '../../api/suppliers';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import { PageLoader } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';
import { toast } from '../../components/toast';
import { parseERPNextError } from '../../components/ErrorState';

function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount || 0) + ' MAD';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const styles = {
    Paid: 'bg-green-50 text-green-700',
    Unpaid: 'bg-orange-50 text-orange-700',
    Overdue: 'bg-red-50 text-red-700',
    'Partly Paid': 'bg-yellow-50 text-yellow-700',
    Cancelled: 'bg-gray-100 text-gray-500',
    Draft: 'bg-gray-100 text-gray-600',
  };
  const labels = {
    Paid: 'Payée', Unpaid: 'Impayée', Overdue: 'En retard',
    'Partly Paid': 'Partielle', Cancelled: 'Annulée', Draft: 'Brouillon',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value || '—'}</dd>
    </div>
  );
}

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [invPage, setInvPage] = useState(0);
  const invLimit = 20;
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [supp, inv, addr, cont] = await Promise.all([
        supplierService.getById(id),
        supplierService.getInvoices(id),
        supplierService.getAddresses(id),
        supplierService.getContacts(id),
      ]);
      setSupplier(supp);
      setInvoices(inv || []);
      setAddresses(addr || []);
      setContacts(cont || []);
    } catch {
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await supplierService.delete(id);
      toast.success('Fournisseur supprimé avec succès');
      navigate('/fournisseurs');
    } catch (err) {
      toast.error(parseERPNextError(err) || 'Impossible de supprimer ce fournisseur.');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const invTotalPages = Math.ceil(invoices.length / invLimit);
  const displayInvoices = invoices.slice(invPage * invLimit, (invPage + 1) * invLimit);

  if (loading) return <PageLoader message="Chargement du fournisseur…" />;

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Fournisseur introuvable</p>
        <Link to="/fournisseurs" className="mt-4 inline-block text-sm text-cobilan-600 hover:underline">
          Retour aux fournisseurs
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate('/fournisseurs')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Fournisseurs
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">{supplier.supplier_name}</h1>
          <p className="mt-1 text-sm text-gray-500">{supplier.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/fournisseurs/${encodeURIComponent(id)}/modifier`)}
            className="px-4 py-2 text-sm font-medium text-cobilan-700 bg-cobilan-50 rounded-lg hover:bg-cobilan-100 transition">
            Modifier
          </button>
          <button onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition">
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations</h3>
            <dl className="space-y-3">
              <InfoRow label="Type" value={supplier.supplier_type === 'Company' ? 'Entreprise' : 'Particulier'} />
              <InfoRow label="Groupe" value={supplier.supplier_group} />
              <InfoRow label="Pays" value={supplier.country} />
              <InfoRow label="Téléphone" value={supplier.mobile_no} />
              <InfoRow label="Email" value={supplier.email_id} />
              <InfoRow label="ICE / IF" value={supplier.tax_id} />
              <InfoRow label="Site web" value={supplier.website} />
              <InfoRow label="Devise" value={supplier.default_currency || 'MAD'} />
            </dl>
          </div>

          {/* Contacts */}
          {contacts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contacts</h3>
              <div className="space-y-3">
                {contacts.map(c => (
                  <div key={c.name} className="text-sm">
                    <p className="font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                    {c.email_id && <p className="text-gray-500">{c.email_id}</p>}
                    {c.mobile_no && <p className="text-gray-500">{c.mobile_no}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adresses */}
          {addresses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Adresses</h3>
              <div className="space-y-3">
                {addresses.map(a => (
                  <div key={a.name} className="text-sm">
                    <p className="font-medium text-gray-900">{a.address_title}</p>
                    <p className="text-gray-500">{a.address_line1}</p>
                    <p className="text-gray-500">{a.city}, {a.country}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Factures d'achat */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Factures d'achat ({invoices.length})
              </h3>
              <button
                onClick={() => navigate('/factures-achat/nouvelle')}
                className="text-xs font-medium text-cobilan-600 hover:text-cobilan-800 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nouvelle facture
              </button>
            </div>
            {invoices.length === 0 ? (
              <div className="p-6">
                <EmptyState icon="invoices" title="Aucune facture d'achat" description="Aucune facture d'achat pour ce fournisseur." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Facture</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Total</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Reste dû</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {displayInvoices.map(inv => (
                      <tr key={inv.name} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-cobilan-600">
                          <Link to={`/factures-achat/${encodeURIComponent(inv.name)}`}>
                            {inv.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-gray-600">{formatDate(inv.posting_date)}</td>
                        <td className="px-6 py-3 text-right text-gray-900">{formatMAD(inv.grand_total)}</td>
                        <td className="px-6 py-3 text-right font-medium text-orange-600">{formatMAD(inv.outstanding_amount)}</td>
                        <td className="px-6 py-3"><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={invPage} totalPages={invTotalPages} total={invoices.length} limit={invLimit} onPageChange={setInvPage} />
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showDelete}
        title="Supprimer ce fournisseur ?"
        message={`Êtes-vous sûr de vouloir supprimer "${supplier.supplier_name}" ? Cette action est irréversible.`}
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

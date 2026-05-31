import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import itemService from '../../api/items';
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

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

function Badge({ children, color = 'gray' }) {
  const colors = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pricePage, setPricePage] = useState(0);
  const priceLimit = 20;
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Nouveau prix
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [newPrice, setNewPrice] = useState({ price_list: 'Standard Selling', price_list_rate: 0, currency: 'MAD', selling: 1, buying: 0 });
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [itemData, priceData] = await Promise.all([
        itemService.getById(id),
        itemService.getPrices(id),
      ]);
      setItem(itemData);
      setPrices(priceData || []);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await itemService.delete(id);
      toast.success('Article supprimé avec succès');
      navigate('/articles');
    } catch (err) {
      toast.error(parseERPNextError(err) || 'Impossible de supprimer cet article.');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const handleToggleDisabled = async () => {
    try {
      await itemService.toggleDisabled(id, !item.disabled);
      toast.success(item.disabled ? 'Article activé avec succès' : 'Article désactivé avec succès');
      loadAll();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleAddPrice = async () => {
    setSavingPrice(true);
    try {
      await itemService.createPrice({ ...newPrice, item_code: id });
      toast.success('Prix ajouté avec succès');
      setShowAddPrice(false);
      setNewPrice({ price_list: 'Standard Selling', price_list_rate: 0, currency: 'MAD', selling: 1, buying: 0 });
      loadAll();
    } catch (err) {
      toast.error(parseERPNextError(err) || 'Erreur lors de la création du prix');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleDeletePrice = async (priceName) => {
    try {
      await itemService.deletePrice(priceName);
      toast.success('Prix supprimé avec succès');
      loadAll();
    } catch {
      toast.error('Impossible de supprimer ce prix');
    }
  };

  const priceTotalPages = Math.ceil(prices.length / priceLimit);
  const displayPrices = prices.slice(pricePage * priceLimit, (pricePage + 1) * priceLimit);

  if (loading) return <PageLoader message="Chargement de l'article…" />;

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Article introuvable</p>
        <Link to="/articles" className="mt-4 inline-block text-sm text-cobilan-600 hover:underline">
          Retour aux articles
        </Link>
      </div>
    );
  }

  const defaults = item.item_defaults?.[0] || {};

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate('/articles')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Articles
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{item.item_name}</h1>
            {item.disabled
              ? <Badge color="red">Désactivé</Badge>
              : <Badge color="green">Actif</Badge>
            }
          </div>
          <p className="mt-1 text-sm text-gray-500">{item.item_code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate(`/articles/${encodeURIComponent(id)}/modifier`)}
            className="px-4 py-2 text-sm font-medium text-cobilan-700 bg-cobilan-50 rounded-lg hover:bg-cobilan-100 transition">
            Modifier
          </button>
          <button onClick={handleToggleDisabled}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              item.disabled
                ? 'text-green-700 bg-green-50 hover:bg-green-100'
                : 'text-orange-700 bg-orange-50 hover:bg-orange-100'
            }`}>
            {item.disabled ? 'Activer' : 'Désactiver'}
          </button>
          <button onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition">
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche — infos */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations</h3>
            <dl className="space-y-3">
              <InfoRow label="Code" value={item.item_code} />
              <InfoRow label="Groupe" value={item.item_group} />
              <InfoRow label="UOM" value={item.uom} />
              <InfoRow label="Type" value={item.is_stock_item ? 'Produit (stock)' : 'Service'} />
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Usage</h3>
            <div className="flex flex-wrap gap-2">
              {item.is_sales_item ? <Badge color="blue">Vente</Badge> : null}
              {item.is_purchase_item ? <Badge color="purple">Achat</Badge> : null}
              {item.is_stock_item ? <Badge color="orange">Stock</Badge> : null}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Prix standard</h3>
            <p className="text-2xl font-bold text-cobilan-700">{formatMAD(item.standard_rate)}</p>
          </div>

          {(defaults.income_account || defaults.expense_account) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Comptabilité</h3>
              <dl className="space-y-3">
                {defaults.income_account && <InfoRow label="Compte revenus" value={defaults.income_account} />}
                {defaults.expense_account && <InfoRow label="Compte charges" value={defaults.expense_account} />}
              </dl>
            </div>
          )}

          {item.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          )}
        </div>

        {/* Colonne droite — prix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Listes de prix ({prices.length})
              </h3>
              <button onClick={() => setShowAddPrice(true)}
                className="text-xs font-medium text-cobilan-600 hover:text-cobilan-800 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter un prix
              </button>
            </div>

            {/* Formulaire ajout prix inline */}
            {showAddPrice && (
              <div className="px-6 py-4 bg-cobilan-50/50 border-b border-cobilan-100">
                <p className="text-xs font-medium text-cobilan-700 mb-3">Nouveau prix</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Liste de prix</label>
                    <input type="text" value={newPrice.price_list}
                      onChange={(e) => setNewPrice(p => ({ ...p, price_list: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Prix (MAD)</label>
                    <input type="number" min="0" step="0.01" value={newPrice.price_list_rate}
                      onChange={(e) => setNewPrice(p => ({ ...p, price_list_rate: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500" />
                  </div>
                  <div className="flex items-end gap-2 col-span-2">
                    <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer mb-1.5">
                      <input type="checkbox" checked={newPrice.selling === 1}
                        onChange={(e) => setNewPrice(p => ({ ...p, selling: e.target.checked ? 1 : 0 }))}
                        className="rounded" />
                      Vente
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer mb-1.5">
                      <input type="checkbox" checked={newPrice.buying === 1}
                        onChange={(e) => setNewPrice(p => ({ ...p, buying: e.target.checked ? 1 : 0 }))}
                        className="rounded" />
                      Achat
                    </label>
                    <button onClick={handleAddPrice} disabled={savingPrice}
                      className="ml-auto px-3 py-1.5 text-xs font-medium bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition">
                      {savingPrice ? 'Ajout…' : 'Ajouter'}
                    </button>
                    <button onClick={() => setShowAddPrice(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {prices.length === 0 && !showAddPrice ? (
              <div className="p-6">
                <EmptyState icon="items" title="Aucune liste de prix" description="Aucune liste de prix configurée pour cet article." />
              </div>
            ) : prices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Liste de prix</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Prix</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Usage</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Validité</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500 w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {displayPrices.map(p => (
                      <tr key={p.name} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">{p.price_list}</td>
                        <td className="px-6 py-3 text-right font-semibold text-cobilan-700">
                          {formatMAD(p.price_list_rate)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-1">
                            {p.selling ? <Badge color="blue">Vente</Badge> : null}
                            {p.buying ? <Badge color="purple">Achat</Badge> : null}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-500 text-xs">
                          {p.valid_from ? `${formatDate(p.valid_from)} → ${formatDate(p.valid_upto) || '∞'}` : 'Permanente'}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => handleDeletePrice(p.name)}
                            className="p-1 text-gray-300 hover:text-red-500 transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <Pagination page={pricePage} totalPages={priceTotalPages} total={prices.length} limit={priceLimit} onPageChange={setPricePage} />
          </div>

          {/* Taxes article */}
          {item.taxes?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Templates de taxes</h3>
              <div className="flex flex-wrap gap-2">
                {item.taxes.map((t, i) => (
                  <Badge key={i} color="orange">{t.item_tax_template}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showDelete}
        title="Supprimer cet article ?"
        message={`Êtes-vous sûr de vouloir supprimer "${item.item_name}" ? L'article ne peut être supprimé que s'il n'est pas utilisé dans des factures.`}
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

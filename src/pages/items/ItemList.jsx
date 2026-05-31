import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import itemService from '../../api/items';
import ConfirmModal from '../../components/ConfirmModal';
import { TableSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';
import { toast } from '../../components/toast';
import { parseERPNextError } from '../../components/ErrorState';

function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount || 0) + ' MAD';
}

const TYPE_FILTERS = [
  { label: 'Tous', value: '' },
  { label: 'Services', value: 'service' },
  { label: 'Produits', value: 'product' },
];

export default function ItemList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const [data, count] = await Promise.all([
        itemService.getAll({ page, limit, search, type: typeFilter }),
        itemService.getCount({ search, type: typeFilter }),
      ]);
      setItems(data || []);
      setTotal(count || 0);
    } catch (err) {
      toast.error('Impossible de charger les articles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(0); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleToggleDisabled = async (item) => {
    try {
      await itemService.toggleDisabled(item.name, !item.disabled);
      toast.success(item.disabled ? 'Article activé avec succès' : 'Article désactivé avec succès');
      loadItems();
    } catch (err) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await itemService.delete(deleteTarget);
      setDeleteTarget(null);
      toast.success('Article supprimé avec succès');
      loadItems();
    } catch (err) {
      toast.error(parseERPNextError(err) || 'Impossible de supprimer cet article.');
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
          <h1 className="text-2xl font-semibold text-gray-900">Articles & Services</h1>
          <p className="mt-1 text-sm text-gray-500">{total} article{total > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => navigate('/articles/nouveau')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cobilan-600 text-white text-sm font-semibold rounded-lg hover:bg-cobilan-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvel article
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un article…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1">
          {TYPE_FILTERS.map(f => (
            <button key={f.value}
              onClick={() => { setTypeFilter(f.value); setPage(0); }}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition ${
                typeFilter === f.value
                  ? 'bg-cobilan-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={search ? 'search' : 'items'}
            title={search ? 'Aucun article trouvé' : 'Aucun article enregistré'}
            description={search ? `Aucun résultat pour "${search}"` : 'Commencez par créer votre premier article.'}
            action={!search ? () => navigate('/articles/nouveau') : undefined}
            actionLabel="Créer un article"
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Article</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Groupe</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Type</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Prix standard</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Usage</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Statut</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.name} className={`hover:bg-gray-50/50 transition-colors ${item.disabled ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-3">
                      <Link to={`/articles/${encodeURIComponent(item.name)}`} className="hover:text-cobilan-600 transition">
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-xs text-gray-400">{item.item_code}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-600 hidden md:table-cell">{item.item_group || '—'}</td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.is_stock_item
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-green-50 text-green-700'
                      }`}>
                        {item.is_stock_item ? 'Produit' : 'Service'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                      {formatMAD(item.standard_rate)}
                    </td>
                    <td className="px-6 py-3 hidden lg:table-cell">
                      <div className="flex gap-1">
                        {item.is_sales_item ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-cobilan-50 text-cobilan-700">Vente</span>
                        ) : null}
                        {item.is_purchase_item ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">Achat</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.disabled ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'
                      }`}>
                        {item.disabled ? 'Désactivé' : 'Actif'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/articles/${encodeURIComponent(item.name)}/modifier`)}
                          className="p-1.5 text-gray-400 hover:text-cobilan-600 rounded-lg hover:bg-cobilan-50 transition"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleDisabled(item)}
                          className={`p-1.5 rounded-lg transition ${
                            item.disabled
                              ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                          }`}
                          title={item.disabled ? 'Activer' : 'Désactiver'}
                        >
                          {item.disabled ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
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
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Précédent
                </button>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Supprimer cet article ?"
        message="Cette action est irréversible. L'article ne peut être supprimé que s'il n'est pas utilisé dans des factures."
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

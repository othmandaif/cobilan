import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supplierService from '../../api/suppliers';
import ConfirmModal from '../../components/ConfirmModal';
import { TableSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';
import { toast } from '../../components/toast';
import { parseERPNextError } from '../../components/ErrorState';

export default function SupplierList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const [data, count] = await Promise.all([
        supplierService.getAll({ page, limit, search }),
        supplierService.getCount({ search }),
      ]);
      setSuppliers(data || []);
      setTotal(count || 0);
    } catch (err) {
      toast.error('Impossible de charger les fournisseurs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(0); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supplierService.delete(deleteTarget);
      setDeleteTarget(null);
      toast.success('Fournisseur supprimé avec succès');
      loadSuppliers();
    } catch (err) {
      toast.error(parseERPNextError(err) || 'Impossible de supprimer ce fournisseur.');
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
          <h1 className="text-2xl font-semibold text-gray-900">Fournisseurs</h1>
          <p className="mt-1 text-sm text-gray-500">{total} fournisseur{total > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => navigate('/fournisseurs/nouveau')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cobilan-600 text-white text-sm font-semibold rounded-lg hover:bg-cobilan-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouveau fournisseur
        </button>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un fournisseur…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={search ? 'search' : 'suppliers'}
            title={search ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur enregistré'}
            description={search ? `Aucun résultat pour "${search}"` : 'Commencez par créer votre premier fournisseur.'}
            action={!search ? () => navigate('/fournisseurs/nouveau') : undefined}
            actionLabel="Créer un fournisseur"
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Fournisseur</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Type</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Téléphone</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Pays</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {suppliers.map((s) => (
                  <tr key={s.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <Link to={`/fournisseurs/${encodeURIComponent(s.name)}`} className="hover:text-cobilan-600 transition">
                        <p className="font-medium text-gray-900">{s.supplier_name}</p>
                        <p className="text-xs text-gray-400">{s.name}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.supplier_type === 'Company' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {s.supplier_type === 'Company' ? 'Entreprise' : 'Particulier'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600 hidden lg:table-cell">{s.mobile_no || '—'}</td>
                    <td className="px-6 py-3 text-gray-600 hidden lg:table-cell">{s.email_id || '—'}</td>
                    <td className="px-6 py-3 text-gray-600 hidden md:table-cell">{s.country || '—'}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/fournisseurs/${encodeURIComponent(s.name)}/modifier`)}
                          className="p-1.5 text-gray-400 hover:text-cobilan-600 rounded-lg hover:bg-cobilan-50 transition"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s.name)}
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
        title="Supprimer ce fournisseur ?"
        message="Cette action est irréversible. Le fournisseur ne pourra être supprimé que s'il n'a aucune facture liée."
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

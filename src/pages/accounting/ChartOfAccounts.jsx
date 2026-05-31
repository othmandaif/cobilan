import { useState, useEffect } from 'react';
import accountingService from '../../api/accounting';
import Pagination from '../../components/Pagination';

const ROOT_TYPE_COLORS = {
  Asset: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Actif' },
  Liability: { bg: 'bg-red-50', text: 'text-red-700', label: 'Passif' },
  Equity: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Capitaux propres' },
  Income: { bg: 'bg-green-50', text: 'text-green-700', label: 'Produits' },
  Expense: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Charges' },
};

const ROOT_TYPES = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

export default function ChartOfAccounts({ company }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;
  const [rootFilter, setRootFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [parentAccounts, setParentAccounts] = useState([]);

  const [newAccount, setNewAccount] = useState({
    account_name: '',
    account_number: '',
    account_type: '',
    root_type: 'Income',
    parent_account: '',
    is_group: 0,
  });

  useEffect(() => {
    if (company) loadAccounts();
  }, [company, rootFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(0); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountingService.getAccounts({ company, rootType: rootFilter, search });
      setAccounts(data || []);
    } catch (err) {
      console.error('Erreur plan comptable:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadParentAccounts = async (rootType) => {
    try {
      const data = await accountingService.getAccounts({ company, rootType });
      setParentAccounts(data.filter(a => a.is_group) || []);
    } catch {}
  };

  const handleCreateAccount = async () => {
    if (!newAccount.account_name.trim()) { setError('Le nom est obligatoire'); return; }
    if (!newAccount.parent_account) { setError('Le compte parent est obligatoire'); return; }
    setSaving(true); setError('');
    try {
      await accountingService.createAccount({ ...newAccount, company });
      setShowForm(false);
      setNewAccount({ account_name: '', account_number: '', account_type: '', root_type: 'Income', parent_account: '', is_group: 0 });
      loadAccounts();
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { setError(JSON.parse(JSON.parse(msg)[0]).message); } catch { setError('Erreur'); } }
      else setError(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const totalPages = Math.ceil(accounts.length / limit);
  const displayAccounts = accounts.slice(page * limit, (page + 1) * limit);

  const grouped = ROOT_TYPES.reduce((acc, rt) => {
    acc[rt] = displayAccounts.filter(a => a.root_type === rt);
    return acc;
  }, {});

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500";

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Rechercher un compte…" value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:border-transparent" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setRootFilter('')}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition ${rootFilter === '' ? 'bg-cobilan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Tous
          </button>
          {ROOT_TYPES.map(rt => (
            <button key={rt} onClick={() => setRootFilter(rt)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition ${rootFilter === rt ? 'bg-cobilan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {ROOT_TYPE_COLORS[rt]?.label || rt}
            </button>
          ))}
        </div>
        <button onClick={() => { setShowForm(true); loadParentAccounts(newAccount.root_type); }}
          className="px-4 py-2.5 text-sm font-medium bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 transition flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouveau compte
        </button>
      </div>

      {/* Formulaire nouveau compte */}
      {showForm && (
        <div className="bg-cobilan-50/50 border border-cobilan-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-cobilan-900 mb-3">Nouveau compte</h3>
          {error && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° compte</label>
              <input type="text" value={newAccount.account_number}
                onChange={(e) => setNewAccount(p => ({ ...p, account_number: e.target.value }))}
                placeholder="Ex: 7061"
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom du compte *</label>
              <input type="text" value={newAccount.account_name}
                onChange={(e) => setNewAccount(p => ({ ...p, account_name: e.target.value }))}
                placeholder="Ex: Prestations comptables"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type racine</label>
              <select value={newAccount.root_type}
                onChange={(e) => {
                  setNewAccount(p => ({ ...p, root_type: e.target.value, parent_account: '' }));
                  loadParentAccounts(e.target.value);
                }}
                className={inputCls}>
                {ROOT_TYPES.map(rt => <option key={rt} value={rt}>{ROOT_TYPE_COLORS[rt]?.label || rt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Compte parent *</label>
              <select value={newAccount.parent_account}
                onChange={(e) => setNewAccount(p => ({ ...p, parent_account: e.target.value }))}
                className={inputCls}>
                <option value="">— Choisir —</option>
                {parentAccounts.map(a => <option key={a.name} value={a.name}>{a.account_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de compte</label>
              <select value={newAccount.account_type}
                onChange={(e) => setNewAccount(p => ({ ...p, account_type: e.target.value }))}
                className={inputCls}>
                <option value="">— Aucun —</option>
                <option value="Bank">Banque</option>
                <option value="Cash">Caisse</option>
                <option value="Receivable">Clients</option>
                <option value="Payable">Fournisseurs</option>
                <option value="Tax">Taxe (TVA)</option>
                <option value="Income Account">Compte de produit</option>
                <option value="Expense Account">Compte de charge</option>
                <option value="Fixed Asset">Immobilisation</option>
                <option value="Depreciation">Amortissement</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={newAccount.is_group === 1}
                  onChange={(e) => setNewAccount(p => ({ ...p, is_group: e.target.checked ? 1 : 0 }))}
                  className="rounded border-gray-300 text-cobilan-600" />
                <span className="text-xs text-gray-600">Compte de groupe</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreateAccount} disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition">
              {saving ? 'Création…' : 'Créer'}
            </button>
            <button onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Plan comptable */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
        </div>
      ) : (<>
        <div className="space-y-4">
          {ROOT_TYPES.filter(rt => !rootFilter || rt === rootFilter).map(rt => {
            const accs = grouped[rt] || [];
            if (accs.length === 0 && rootFilter !== rt) return null;
            const color = ROOT_TYPE_COLORS[rt];
            return (
              <div key={rt} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`px-6 py-3 border-b border-gray-100 ${color.bg}`}>
                  <h3 className={`text-sm font-semibold ${color.text}`}>
                    {color.label} ({accs.length})
                  </h3>
                </div>
                {accs.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-gray-400">Aucun compte</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-50 bg-gray-50/30">
                          <th className="text-left px-6 py-2 font-medium text-gray-400 text-xs">N°</th>
                          <th className="text-left px-6 py-2 font-medium text-gray-400 text-xs">Nom</th>
                          <th className="text-left px-6 py-2 font-medium text-gray-400 text-xs hidden md:table-cell">Type</th>
                          <th className="text-left px-6 py-2 font-medium text-gray-400 text-xs hidden lg:table-cell">Parent</th>
                          <th className="text-left px-6 py-2 font-medium text-gray-400 text-xs">Niveau</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {accs.map(acc => (
                          <tr key={acc.name} className={`hover:bg-gray-50/50 ${acc.is_group ? 'font-medium' : ''}`}>
                            <td className="px-6 py-2.5 text-gray-500 font-mono text-xs">
                              {acc.account_number || '—'}
                            </td>
                            <td className="px-6 py-2.5">
                              <span className={`${acc.is_group ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                                {acc.account_name}
                              </span>
                            </td>
                            <td className="px-6 py-2.5 hidden md:table-cell">
                              {acc.account_type && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  {acc.account_type}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-2.5 text-gray-400 text-xs hidden lg:table-cell">
                              {acc.parent_account ? acc.parent_account.split(' - ')[0] : '—'}
                            </td>
                            <td className="px-6 py-2.5">
                              {acc.is_group ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cobilan-50 text-cobilan-700">Groupe</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">Détail</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Pagination page={page} totalPages={totalPages} total={accounts.length} limit={limit} onPageChange={setPage} />
      </>)}
    </div>
  );
}

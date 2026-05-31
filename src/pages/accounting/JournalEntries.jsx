import { useState, useEffect, useCallback } from 'react';
import accountingService from '../../api/accounting';
import ConfirmModal from '../../components/ConfirmModal';

function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

const VOUCHER_TYPES = [
  'Journal Entry', 'Opening Entry', 'Bank Entry', 'Cash Entry',
  'Credit Note', 'Debit Note', 'Contra Entry', 'Depreciation Entry',
];
const VOUCHER_LABELS = {
  'Journal Entry': 'Écriture générale',
  'Opening Entry': 'Écriture d\'ouverture',
  'Bank Entry': 'Écriture bancaire',
  'Cash Entry': 'Écriture de caisse',
  'Credit Note': 'Note de crédit',
  'Debit Note': 'Note de débit',
  'Contra Entry': 'Virement interne',
  'Depreciation Entry': 'Amortissement',
};

export default function JournalEntries({ company }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [voucherFilter, setVoucherFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const limit = 20;

  const [form, setForm] = useState({
    voucher_type: 'Journal Entry',
    posting_date: todayStr(),
    remark: '',
    accounts: [
      { account: '', debit_in_account_currency: 0, credit_in_account_currency: 0, cost_center: '' },
      { account: '', debit_in_account_currency: 0, credit_in_account_currency: 0, cost_center: '' },
    ],
  });

  const loadEntries = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [data, count] = await Promise.all([
        accountingService.getJournalEntries({ page, limit, company, voucher_type: voucherFilter }),
        accountingService.getJournalEntryCount({ company, voucher_type: voucherFilter }),
      ]);
      setEntries(data || []);
      setTotal(count || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [company, page, voucherFilter]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  useEffect(() => {
    if (!company) return;
    Promise.all([
      accountingService.getAccounts({ company }),
      accountingService.getCostCenters(company),
    ]).then(([accs, ccs]) => {
      setAccounts(accs?.filter(a => !a.is_group) || []);
      setCostCenters(ccs?.filter(c => !c.is_group) || []);
    }).catch(() => {});
  }, [company]);

  const loadEntry = async (name) => {
    try {
      const data = await accountingService.getJournalEntryById(name);
      setSelectedEntry(data);
    } catch { setSelectedEntry(null); }
  };

  const totalDebit = form.accounts.reduce((s, a) => s + (Number(a.debit_in_account_currency) || 0), 0);
  const totalCredit = form.accounts.reduce((s, a) => s + (Number(a.credit_in_account_currency) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const addLine = () => {
    setForm(p => ({
      ...p,
      accounts: [...p.accounts, { account: '', debit_in_account_currency: 0, credit_in_account_currency: 0, cost_center: '' }],
    }));
  };

  const removeLine = (i) => {
    if (form.accounts.length <= 2) return;
    setForm(p => ({ ...p, accounts: p.accounts.filter((_, idx) => idx !== i) }));
  };

  const updateLine = (i, field, value) => {
    setForm(p => {
      const accs = [...p.accounts];
      accs[i] = { ...accs[i], [field]: value };
      return { ...p, accounts: accs };
    });
  };

  const handleCreate = async () => {
    setError('');
    if (!isBalanced) { setError('Le total des débits doit être égal au total des crédits'); return; }
    const validLines = form.accounts.filter(a => a.account);
    if (validLines.length < 2) { setError('Ajoutez au moins 2 lignes avec des comptes'); return; }
    setSaving(true);
    try {
      await accountingService.createJournalEntry({
        voucher_type: form.voucher_type,
        posting_date: form.posting_date,
        company,
        remark: form.remark,
        accounts: validLines.map(a => ({
          account: a.account,
          debit_in_account_currency: Number(a.debit_in_account_currency) || 0,
          credit_in_account_currency: Number(a.credit_in_account_currency) || 0,
          ...(a.cost_center && { cost_center: a.cost_center }),
        })),
      });
      setShowForm(false);
      setForm({
        voucher_type: 'Journal Entry', posting_date: todayStr(), remark: '',
        accounts: [
          { account: '', debit_in_account_currency: 0, credit_in_account_currency: 0, cost_center: '' },
          { account: '', debit_in_account_currency: 0, credit_in_account_currency: 0, cost_center: '' },
        ],
      });
      loadEntries();
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { setError(JSON.parse(JSON.parse(msg)[0]).message); } catch { setError('Erreur'); } }
      else setError(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleSubmitEntry = async (name) => {
    setActionLoading(name);
    try {
      await accountingService.submitJournalEntry(name);
      if (selectedEntry?.name === name) loadEntry(name);
      loadEntries();
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { alert(JSON.parse(JSON.parse(msg)[0]).message); } catch { alert('Erreur soumission'); } }
      else alert(err.response?.data?.message || 'Erreur soumission');
    } finally { setActionLoading(''); }
  };

  const handleCancel = async (name) => {
    setActionLoading(name + '_cancel');
    try {
      await accountingService.cancelJournalEntry(name);
      if (selectedEntry?.name === name) loadEntry(name);
      loadEntries();
    } catch (err) { alert('Erreur annulation'); }
    finally { setActionLoading(''); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await accountingService.deleteJournalEntry(deleteTarget);
      setDeleteTarget(null);
      if (selectedEntry?.name === deleteTarget) setSelectedEntry(null);
      loadEntries();
    } catch (err) { alert(err.response?.data?.message || 'Impossible de supprimer'); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);
  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Liste */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => { setVoucherFilter(''); setPage(0); }}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition ${voucherFilter === '' ? 'bg-cobilan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Toutes
            </button>
            {['Journal Entry', 'Bank Entry', 'Cash Entry', 'Contra Entry'].map(vt => (
              <button key={vt} onClick={() => { setVoucherFilter(vt); setPage(0); }}
                className={`px-2 py-1 text-xs font-medium rounded-lg transition ${voucherFilter === vt ? 'bg-cobilan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {VOUCHER_LABELS[vt] || vt}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-3 py-2 text-sm font-medium bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 transition flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouvelle
          </button>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="bg-cobilan-50/50 border border-cobilan-200 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-semibold text-cobilan-900 mb-3">Nouvelle écriture</h3>
            {error && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={form.voucher_type} onChange={(e) => setForm(p => ({ ...p, voucher_type: e.target.value }))} className={inputCls}>
                  {VOUCHER_TYPES.map(vt => <option key={vt} value={vt}>{VOUCHER_LABELS[vt] || vt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input type="date" value={form.posting_date} onChange={(e) => setForm(p => ({ ...p, posting_date: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarque</label>
                <input type="text" value={form.remark} onChange={(e) => setForm(p => ({ ...p, remark: e.target.value }))}
                  placeholder="Libellé de l'écriture" className={inputCls} />
              </div>
            </div>

            {/* Lignes */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-200">
                    <th className="text-left py-2 pr-2 font-medium">Compte</th>
                    <th className="text-right py-2 px-2 font-medium">Débit (MAD)</th>
                    <th className="text-right py-2 px-2 font-medium">Crédit (MAD)</th>
                    <th className="text-left py-2 px-2 font-medium hidden sm:table-cell">Centre de coût</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.accounts.map((line, i) => (
                    <tr key={i}>
                      <td className="py-1.5 pr-2">
                        <select value={line.account} onChange={(e) => updateLine(i, 'account', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cobilan-500">
                          <option value="">— Compte —</option>
                          {accounts.map(a => <option key={a.name} value={a.name}>{a.account_number ? `${a.account_number} - ` : ''}{a.account_name}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <input type="number" min="0" step="0.01" value={line.debit_in_account_currency}
                          onChange={(e) => updateLine(i, 'debit_in_account_currency', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-cobilan-500" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input type="number" min="0" step="0.01" value={line.credit_in_account_currency}
                          onChange={(e) => updateLine(i, 'credit_in_account_currency', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-cobilan-500" />
                      </td>
                      <td className="py-1.5 px-2 hidden sm:table-cell">
                        <select value={line.cost_center} onChange={(e) => updateLine(i, 'cost_center', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cobilan-500">
                          <option value="">—</option>
                          {costCenters.map(cc => <option key={cc.name} value={cc.name}>{cc.cost_center_name}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 text-right">
                        {form.accounts.length > 2 && (
                          <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500 transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 font-semibold text-xs">
                    <td className="py-2 pr-2 text-gray-500">Total</td>
                    <td className={`py-2 px-2 text-right ${!isBalanced ? 'text-red-600' : 'text-gray-900'}`}>{formatMAD(totalDebit)}</td>
                    <td className={`py-2 px-2 text-right ${!isBalanced ? 'text-red-600' : 'text-gray-900'}`}>{formatMAD(totalCredit)}</td>
                    <td className="hidden sm:table-cell" />
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {!isBalanced && totalDebit > 0 && (
              <p className="text-xs text-red-600 mt-1">
                Déséquilibre : {formatMAD(Math.abs(totalDebit - totalCredit))} MAD
              </p>
            )}

            <div className="flex gap-2 mt-3 items-center">
              <button onClick={addLine} className="text-xs text-cobilan-600 hover:text-cobilan-800 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter une ligne
              </button>
              <div className="ml-auto flex gap-2">
                <button onClick={handleCreate} disabled={saving || !isBalanced}
                  className="px-4 py-2 text-sm font-medium bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition">
                  {saving ? 'Création…' : 'Créer'}
                </button>
                <button onClick={() => { setShowForm(false); setError(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center py-12 text-sm text-gray-400">Aucune écriture comptable</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Écriture</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Type</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Débit</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Statut</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map(entry => (
                    <tr key={entry.name}
                      onClick={() => loadEntry(entry.name)}
                      className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selectedEntry?.name === entry.name ? 'bg-cobilan-50/50' : ''}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-cobilan-600">{entry.name}</p>
                        {entry.remark && <p className="text-xs text-gray-400 truncate max-w-[200px]">{entry.remark}</p>}
                      </td>
                      <td className="px-5 py-3 text-gray-600 hidden md:table-cell">
                        <span className="text-xs">{VOUCHER_LABELS[entry.voucher_type] || entry.voucher_type}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 hidden md:table-cell">{formatDate(entry.posting_date)}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">{formatMAD(entry.total_debit)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.docstatus === 0 ? 'bg-gray-100 text-gray-600' :
                          entry.docstatus === 1 ? 'bg-green-50 text-green-700' :
                          'bg-red-50 text-red-500'
                        }`}>
                          {entry.docstatus === 0 ? 'Brouillon' : entry.docstatus === 1 ? 'Soumise' : 'Annulée'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {entry.docstatus === 0 && (
                            <>
                              <button onClick={() => handleSubmitEntry(entry.name)}
                                disabled={actionLoading === entry.name}
                                className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50 transition"
                                title="Soumettre">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </button>
                              <button onClick={() => setDeleteTarget(entry.name)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                                title="Supprimer">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </>
                          )}
                          {entry.docstatus === 1 && (
                            <button onClick={() => handleCancel(entry.name)}
                              disabled={actionLoading === entry.name + '_cancel'}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                              title="Annuler">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">{page * limit + 1}–{Math.min((page + 1) * limit, total)} sur {total}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                  Précédent
                </button>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Détail écriture */}
      <div className="lg:col-span-1">
        {selectedEntry ? (
          <div className="bg-white rounded-xl border border-gray-200 sticky top-4">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cobilan-700">{selectedEntry.name}</p>
                <p className="text-xs text-gray-400">{VOUCHER_LABELS[selectedEntry.voucher_type] || selectedEntry.voucher_type}</p>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-gray-300 hover:text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><p className="text-gray-400">Date</p><p className="font-medium">{formatDate(selectedEntry.posting_date)}</p></div>
                <div><p className="text-gray-400">Statut</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                    selectedEntry.docstatus === 0 ? 'bg-gray-100 text-gray-600' :
                    selectedEntry.docstatus === 1 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                  }`}>
                    {selectedEntry.docstatus === 0 ? 'Brouillon' : selectedEntry.docstatus === 1 ? 'Soumise' : 'Annulée'}
                  </span>
                </div>
                <div className="col-span-2"><p className="text-gray-400">Remarque</p><p className="font-medium">{selectedEntry.remark || '—'}</p></div>
              </div>

              {/* Lignes */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Lignes comptables</p>
                <div className="space-y-2">
                  {(selectedEntry.accounts || []).map((line, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs">
                      <p className="font-medium text-gray-900 truncate">{line.account}</p>
                      <div className="flex justify-between mt-1">
                        {line.debit_in_account_currency > 0 && (
                          <span className="text-cobilan-700">D: {formatMAD(line.debit_in_account_currency)}</span>
                        )}
                        {line.credit_in_account_currency > 0 && (
                          <span className="text-red-600">C: {formatMAD(line.credit_in_account_currency)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totaux */}
              <div className="border-t border-gray-100 pt-3 text-xs space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-600">Total Débit</span>
                  <span className="text-cobilan-700">{formatMAD(selectedEntry.total_debit)} MAD</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-600">Total Crédit</span>
                  <span className="text-red-600">{formatMAD(selectedEntry.total_credit)} MAD</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
            </svg>
            <p className="text-sm">Cliquez sur une écriture pour voir le détail</p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Supprimer cette écriture ?"
        message="Seules les écritures en brouillon peuvent être supprimées."
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

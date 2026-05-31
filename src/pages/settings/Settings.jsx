import { useState, useEffect } from 'react';
import settingsService from '../../api/settings';
import ConfirmModal from '../../components/ConfirmModal';

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500";

const TABS = [
  { id: 'company', label: 'Société' },
  { id: 'fiscal', label: 'Exercices fiscaux' },
  { id: 'payment_modes', label: 'Modes de paiement' },
  { id: 'users', label: 'Utilisateurs' },
];

function CompanyTab() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsService.getCompanies().then(async data => {
      setCompanies(data || []);
      if (data?.length > 0) {
        setSelected(data[0].name);
        const detail = await settingsService.getCompany(data[0].name);
        setForm(detail);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSelectCompany = async (name) => {
    setSelected(name);
    setLoading(true);
    try {
      const detail = await settingsService.getCompany(name);
      setForm(detail);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await settingsService.updateCompany(selected, {
        phone: form.phone || '',
        email: form.email || '',
        website: form.website || '',
        tax_id: form.tax_id || '',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { setError(JSON.parse(JSON.parse(msg)[0]).message); } catch { setError('Erreur'); } }
      else setError(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl">
      {companies.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Société</label>
          <select value={selected} onChange={(e) => handleSelectCompany(e.target.value)} className={inputCls}>
            {companies.map(c => <option key={c.name} value={c.name}>{c.company_name || c.name}</option>)}
          </select>
        </div>
      )}

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">Modifications enregistrées</div>}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {/* Champs lecture seule */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'company_name', label: 'Nom' },
              { key: 'abbr', label: 'Abréviation' },
              { key: 'country', label: 'Pays' },
              { key: 'default_currency', label: 'Devise' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input value={form[f.key] || ''} disabled
                  className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`} />
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          {/* Champs modifiables */}
          <div className="space-y-3">
            {[
              { key: 'email', label: 'Email', type: 'email', placeholder: 'admin@societe.ma' },
              { key: 'phone', label: 'Téléphone', type: 'tel', placeholder: '+212522000000' },
              { key: 'website', label: 'Site web', type: 'url', placeholder: 'www.societe.ma' },
              { key: 'tax_id', label: 'ICE / Identifiant fiscal', type: 'text', placeholder: '001234567000089' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type={f.type} value={form[f.key] || ''} placeholder={f.placeholder}
                  onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className={inputCls} />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">Le nom, l'abréviation, le pays et la devise ne peuvent être modifiés que depuis ERPNext directement.</p>

          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-cobilan-600 text-white text-sm font-semibold rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      )}
    </div>
  );
}

function FiscalYearTab() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ year: '', year_start_date: '', year_end_date: '', company: '' });

  useEffect(() => {
    load();
    settingsService.getCompanies().then(d => {
      setCompanies(d || []);
      if (d?.length > 0) setForm(p => ({ ...p, company: d[0].name }));
    }).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try { setYears(await settingsService.getFiscalYears() || []); }
    catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.year || !form.year_start_date || !form.year_end_date) { setError('Tous les champs sont obligatoires'); return; }
    setSaving(true); setError('');
    try {
      await settingsService.createFiscalYear({
        year: form.year,
        year_start_date: form.year_start_date,
        year_end_date: form.year_end_date,
        companies: [{ company: form.company }],
      });
      setShowForm(false);
      setForm(p => ({ ...p, year: '', year_start_date: '', year_end_date: '' }));
      load();
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { setError(JSON.parse(JSON.parse(msg)[0]).message); } catch { setError('Erreur'); } }
      else setError(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{years.length} exercice{years.length > 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvel exercice
        </button>
      </div>

      {showForm && (
        <div className="bg-cobilan-50 border border-cobilan-200 rounded-xl p-5 mb-4 space-y-3">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom (ex: 2027)</label>
              <input type="text" value={form.year} onChange={(e) => setForm(p => ({ ...p, year: e.target.value }))} placeholder="2027" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date début</label>
              <input type="date" value={form.year_start_date} onChange={(e) => setForm(p => ({ ...p, year_start_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date fin</label>
              <input type="date" value={form.year_end_date} onChange={(e) => setForm(p => ({ ...p, year_end_date: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Société</label>
            <select value={form.company} onChange={(e) => setForm(p => ({ ...p, company: e.target.value }))} className={inputCls}>
              {companies.map(c => <option key={c.name} value={c.name}>{c.company_name || c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-cobilan-600 border-t-transparent" />
          </div>
        ) : years.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">Aucun exercice fiscal</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Exercice</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Début</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Fin</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {years.map(y => (
                <tr key={y.name} className="hover:bg-gray-50/30">
                  <td className="px-5 py-3 font-semibold text-gray-900">{y.name}</td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(y.year_start_date)}</td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(y.year_end_date)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${y.disabled ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'}`}>
                      {y.disabled ? 'Désactivé' : 'Actif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PaymentModesTab() {
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newMode, setNewMode] = useState({ mode_of_payment: '', type: 'General' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setModes(await settingsService.getPaymentModes() || []); }
    catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newMode.mode_of_payment.trim()) { setError('Le nom est obligatoire'); return; }
    setSaving(true); setError('');
    try {
      await settingsService.createPaymentMode(newMode);
      setShowForm(false);
      setNewMode({ mode_of_payment: '', type: 'General' });
      load();
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { setError(JSON.parse(JSON.parse(msg)[0]).message); } catch { setError('Erreur'); } }
      else setError(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await settingsService.deletePaymentMode(deleteTarget); setDeleteTarget(null); load(); }
    catch (err) { alert(err.response?.data?.message || 'Impossible de supprimer'); }
    finally { setDeleting(false); }
  };

  const TYPE_LABELS = { Cash: 'Espèces', Bank: 'Banque', General: 'Général' };
  const TYPE_COLORS = { Cash: 'bg-green-50 text-green-700', Bank: 'bg-blue-50 text-blue-700', General: 'bg-gray-100 text-gray-600' };

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{modes.length} mode{modes.length > 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium bg-cobilan-600 text-white rounded-lg hover:bg-cobilan-700 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouveau mode
        </button>
      </div>

      {showForm && (
        <div className="bg-cobilan-50 border border-cobilan-200 rounded-xl p-4 mb-4 space-y-3">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <input type="text" value={newMode.mode_of_payment}
                onChange={(e) => setNewMode(p => ({ ...p, mode_of_payment: e.target.value }))}
                placeholder="Ex: Virement CIH" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select value={newMode.type} onChange={(e) => setNewMode(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                <option value="Cash">Espèces</option>
                <option value="Bank">Banque</option>
                <option value="General">Général (chèque, effet…)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-cobilan-600 border-t-transparent" />
          </div>
        ) : modes.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">Aucun mode de paiement</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Mode</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {modes.map(m => (
                <tr key={m.name} className="hover:bg-gray-50/30">
                  <td className="px-5 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[m.type] || m.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setDeleteTarget(m.name)}
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
        )}
      </div>

      <ConfirmModal open={!!deleteTarget} title="Supprimer ce mode de paiement ?"
        message="Il ne pourra être supprimé que s'il n'est pas utilisé dans des paiements."
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'} danger
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.getUsers().then(d => setUsers(d || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function formatDate(d) {
    if (!d) return 'Jamais';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-gray-500 mb-4">{users.length} utilisateur{users.length > 1 ? 's' : ''} actif{users.length > 1 ? 's' : ''}</p>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-cobilan-600 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">Aucun utilisateur</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Utilisateur</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Rôle</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.name} className="hover:bg-gray-50/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-cobilan-100 text-cobilan-700 flex items-center justify-center text-sm font-semibold shrink-0">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.full_name || u.name}</p>
                        <p className="text-xs text-gray-400">{u.email || u.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {u.role_profile_name && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cobilan-50 text-cobilan-700">
                        {u.role_profile_name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 hidden lg:table-cell text-xs">{formatDate(u.last_active)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-400">Pour ajouter ou modifier des utilisateurs, connectez-vous sur <a href="http://localhost:8080" target="_blank" rel="noreferrer" className="text-cobilan-600 hover:underline">ERPNext</a>.</p>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">Configuration de CoBilan</p>
      </div>
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-cobilan-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'company' && <CompanyTab />}
      {activeTab === 'fiscal' && <FiscalYearTab />}
      {activeTab === 'payment_modes' && <PaymentModesTab />}
      {activeTab === 'users' && <UsersTab />}
    </div>
  );
}
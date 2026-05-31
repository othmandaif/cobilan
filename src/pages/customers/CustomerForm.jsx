import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import customerService from '../../api/customers';
import { toast } from '../../components/toast';
import { parseERPNextError } from '../../components/ErrorState';
import { PageLoader } from '../../components/skeletons';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState([]);
  const [territories, setTerritories] = useState([]);

  const [form, setForm] = useState({
    customer_name: '',
    customer_type: 'Company',
    customer_group: 'Commercial',
    territory: 'Morocco',
    mobile_no: '',
    email_id: '',
    tax_id: '',
    default_currency: 'MAD',
    website: '',
  });

  useEffect(() => {
    loadOptions();
    if (isEdit) loadCustomer();
  }, [id]);

  const loadOptions = async () => {
    try {
      const [g, t] = await Promise.all([
        customerService.getGroups(),
        customerService.getTerritories(),
      ]);
      setGroups(g || []);
      setTerritories(t || []);
    } catch {}
  };

  const loadCustomer = async () => {
    try {
      const data = await customerService.getById(id);
      setForm({
        customer_name: data.customer_name || '',
        customer_type: data.customer_type || 'Company',
        customer_group: data.customer_group || 'Commercial',
        territory: data.territory || 'Morocco',
        mobile_no: data.mobile_no || '',
        email_id: data.email_id || '',
        tax_id: data.tax_id || '',
        default_currency: data.default_currency || 'MAD',
        website: data.website || '',
      });
    } catch {
      toast.error('Client introuvable');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customer_name.trim()) { setError('Le nom du client est obligatoire'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await customerService.update(id, form);
        toast.success('Client mis à jour avec succès');
      } else {
        await customerService.create(form);
        toast.success('Client créé avec succès');
      }
      navigate('/clients');
    } catch (err) {
      const msg = parseERPNextError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader message="Chargement du client…" />;

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:border-transparent";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => navigate('/clients')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour aux clients
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEdit ? 'Modifier le client' : 'Nouveau client'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client <span className="text-red-500">*</span></label>
            <input type="text" value={form.customer_name}
              onChange={(e) => setForm(p => ({ ...p, customer_name: e.target.value }))}
              placeholder="Société ABC SARL" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.customer_type} onChange={(e) => setForm(p => ({ ...p, customer_type: e.target.value }))} className={inputCls}>
                <option value="Company">Entreprise</option>
                <option value="Individual">Particulier</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
              <select value={form.customer_group} onChange={(e) => setForm(p => ({ ...p, customer_group: e.target.value }))} className={inputCls}>
                {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                {groups.length === 0 && <option value="Commercial">Commercial</option>}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Territoire</label>
            <select value={form.territory} onChange={(e) => setForm(p => ({ ...p, territory: e.target.value }))} className={inputCls}>
              {territories.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              {territories.length === 0 && <option value="Morocco">Morocco</option>}
            </select>
          </div>

          <hr className="border-gray-100" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={form.mobile_no} onChange={(e) => setForm(p => ({ ...p, mobile_no: e.target.value }))} placeholder="+212600000000" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email_id} onChange={(e) => setForm(p => ({ ...p, email_id: e.target.value }))} placeholder="contact@societe.ma" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ICE / Identifiant fiscal</label>
              <input type="text" value={form.tax_id} onChange={(e) => setForm(p => ({ ...p, tax_id: e.target.value }))} placeholder="001234567000089" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
              <input type="url" value={form.website} onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))} placeholder="www.societe.ma" className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="px-6 py-2.5 bg-cobilan-600 text-white text-sm font-semibold rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition flex items-center gap-2">
              {saving && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEdit ? 'Enregistrer' : 'Créer le client'}
            </button>
            <button type="button" onClick={() => navigate('/clients')}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import supplierService from '../../api/suppliers';
import { toast } from '../../components/toast';
import { parseERPNextError } from '../../components/ErrorState';
import { PageLoader } from '../../components/skeletons';

export default function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState([]);

  const [form, setForm] = useState({
    supplier_name: '',
    supplier_type: 'Company',
    supplier_group: 'All Supplier Groups',
    country: 'Morocco',
    mobile_no: '',
    email_id: '',
    tax_id: '',
    default_currency: 'MAD',
    website: '',
  });

  useEffect(() => {
    loadGroups();
    if (isEdit) loadSupplier();
  }, [id]);

  const loadGroups = async () => {
    try {
      const data = await supplierService.getGroups();
      setGroups(data || []);
    } catch {}
  };

  const loadSupplier = async () => {
    try {
      const data = await supplierService.getById(id);
      setForm({
        supplier_name: data.supplier_name || '',
        supplier_type: data.supplier_type || 'Company',
        supplier_group: data.supplier_group || 'All Supplier Groups',
        country: data.country || 'Morocco',
        mobile_no: data.mobile_no || '',
        email_id: data.email_id || '',
        tax_id: data.tax_id || '',
        default_currency: data.default_currency || 'MAD',
        website: data.website || '',
      });
    } catch {
      toast.error('Fournisseur introuvable');
      navigate('/fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.supplier_name.trim()) { setError('Le nom du fournisseur est obligatoire'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await supplierService.update(id, form);
        toast.success('Fournisseur mis à jour avec succès');
      } else {
        await supplierService.create(form);
        toast.success('Fournisseur créé avec succès');
      }
      navigate('/fournisseurs');
    } catch (err) {
      const msg = parseERPNextError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader message="Chargement du fournisseur…" />;

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:border-transparent";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => navigate('/fournisseurs')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour aux fournisseurs
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-5">

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du fournisseur <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.supplier_name}
              onChange={(e) => setForm(p => ({ ...p, supplier_name: e.target.value }))}
              placeholder="Fournisseur XYZ SARL"
              className={inputCls} />
          </div>

          {/* Type + Groupe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.supplier_type}
                onChange={(e) => setForm(p => ({ ...p, supplier_type: e.target.value }))}
                className={inputCls}>
                <option value="Company">Entreprise</option>
                <option value="Individual">Particulier</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
              <select value={form.supplier_group}
                onChange={(e) => setForm(p => ({ ...p, supplier_group: e.target.value }))}
                className={inputCls}>
                {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                {groups.length === 0 && <option value="All Supplier Groups">All Supplier Groups</option>}
              </select>
            </div>
          </div>

          {/* Pays */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
            <input type="text" value={form.country}
              onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))}
              placeholder="Morocco"
              className={inputCls} />
          </div>

          <hr className="border-gray-100" />

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={form.mobile_no}
                onChange={(e) => setForm(p => ({ ...p, mobile_no: e.target.value }))}
                placeholder="+212600000000"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email_id}
                onChange={(e) => setForm(p => ({ ...p, email_id: e.target.value }))}
                placeholder="contact@fournisseur.ma"
                className={inputCls} />
            </div>
          </div>

          {/* ICE + Site */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ICE / Identifiant fiscal</label>
              <input type="text" value={form.tax_id}
                onChange={(e) => setForm(p => ({ ...p, tax_id: e.target.value }))}
                placeholder="001234567000089"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
              <input type="url" value={form.website}
                onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))}
                placeholder="www.fournisseur.ma"
                className={inputCls} />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="px-6 py-2.5 bg-cobilan-600 text-white text-sm font-semibold rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition flex items-center gap-2">
              {saving && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEdit ? 'Enregistrer' : 'Créer le fournisseur'}
            </button>
            <button type="button" onClick={() => navigate('/fournisseurs')}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

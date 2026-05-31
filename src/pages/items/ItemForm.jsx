import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import itemService from '../../api/items';
import { toast } from '../../components/toast';
import { parseERPNextError } from '../../components/ErrorState';
import { PageLoader } from '../../components/skeletons';

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:border-transparent";

export default function ItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [groups, setGroups] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [taxTemplates, setTaxTemplates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [incomeAccounts, setIncomeAccounts] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);

  const [form, setForm] = useState({
    item_code: '',
    item_name: '',
    item_group: '',
    description: '',
    is_stock_item: 0,
    is_sales_item: 1,
    is_purchase_item: 0,
    standard_rate: 0,
    valuation_rate: 0,
    uom: 'Nos',
    disabled: 0,
    income_account: '',
    expense_account: '',
    item_tax_template: '',
  });

  useEffect(() => {
    loadOptions();
    if (isEdit) loadItem();
  }, [id]);

  // Charger comptes quand la société change
  useEffect(() => {
    if (companies.length > 0) {
      const company = companies[0].name;
      Promise.all([
        itemService.getIncomeAccounts(company),
        itemService.getExpenseAccounts(company),
      ]).then(([inc, exp]) => {
        setIncomeAccounts(inc || []);
        setExpenseAccounts(exp || []);
      }).catch(() => {});
    }
  }, [companies]);

  const loadOptions = async () => {
    try {
      const [grp, uom, taxes, comp] = await Promise.all([
        itemService.getGroups(),
        itemService.getUOMs(),
        itemService.getItemTaxTemplates(),
        itemService.getCompanies(),
      ]);
      setGroups(grp || []);
      setUoms(uom || []);
      setTaxTemplates(taxes || []);
      setCompanies(comp || []);
    } catch (err) {
      console.error('Erreur chargement options:', err);
    }
  };

  const loadItem = async () => {
    try {
      const data = await itemService.getById(id);
      setForm({
        item_code: data.item_code || '',
        item_name: data.item_name || '',
        item_group: data.item_group || '',
        description: data.description || '',
        is_stock_item: data.is_stock_item || 0,
        is_sales_item: data.is_sales_item !== undefined ? data.is_sales_item : 1,
        is_purchase_item: data.is_purchase_item || 0,
        standard_rate: data.standard_rate || 0,
        valuation_rate: data.valuation_rate || 0,
        uom: data.uom || 'Nos',
        disabled: data.disabled || 0,
        income_account: data.item_defaults?.[0]?.income_account || '',
        expense_account: data.item_defaults?.[0]?.expense_account || '',
        item_tax_template: data.taxes?.[0]?.item_tax_template || '',
      });
    } catch {
      toast.error('Article introuvable');
      navigate('/articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.item_name.trim()) { setError('Le nom de l\'article est obligatoire'); return; }

    setSaving(true);
    try {
      const company = companies[0]?.name || '';
      const payload = {
        item_code: form.item_code || form.item_name,
        item_name: form.item_name,
        item_group: form.item_group || 'All Item Groups',
        description: form.description || '',
        is_stock_item: form.is_stock_item,
        is_sales_item: form.is_sales_item,
        is_purchase_item: form.is_purchase_item,
        standard_rate: Number(form.standard_rate) || 0,
        uom: form.uom || 'Nos',
        disabled: form.disabled,
      };

      // Compte de revenu / charge via item_defaults
      if (company && (form.income_account || form.expense_account)) {
        payload.item_defaults = [{
          company,
          ...(form.income_account && { income_account: form.income_account }),
          ...(form.expense_account && { expense_account: form.expense_account }),
        }];
      }

      // Template de taxe article
      if (form.item_tax_template) {
        payload.taxes = [{ item_tax_template: form.item_tax_template }];
      }

      if (isEdit) {
        await itemService.update(id, payload);
        toast.success('Article mis à jour avec succès');
        navigate(`/articles/${encodeURIComponent(id)}`);
      } else {
        const result = await itemService.create(payload);
        toast.success('Article créé avec succès');
        navigate(`/articles/${encodeURIComponent(result.name)}`);
      }
    } catch (err) {
      const msg = parseERPNextError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader message="Chargement de l'article…" />;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => navigate('/articles')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour aux articles
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEdit ? 'Modifier l\'article' : 'Nouvel article'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-5">

        {/* ── Identification ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Identification</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'article <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.item_name}
                onChange={(e) => setForm(p => ({ ...p, item_name: e.target.value }))}
                placeholder="Ex: Tenue de comptabilité mensuelle"
                className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code article
                <span className="ml-1 text-xs text-gray-400">(laissez vide pour utiliser le nom)</span>
              </label>
              <input type="text" value={form.item_code}
                onChange={(e) => setForm(p => ({ ...p, item_code: e.target.value }))}
                placeholder="Ex: PREST-COMPTA-001"
                className={inputCls} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
                <select value={form.item_group}
                  onChange={(e) => setForm(p => ({ ...p, item_group: e.target.value }))}
                  className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {groups.filter(g => !g.is_group).map(g => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unité de mesure</label>
                <select value={form.uom}
                  onChange={(e) => setForm(p => ({ ...p, uom: e.target.value }))}
                  className={inputCls}>
                  {uoms.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                  {uoms.length === 0 && (
                    <>
                      <option value="Nos">Nos (Unité)</option>
                      <option value="Hour">Hour (Heure)</option>
                      <option value="Day">Day (Jour)</option>
                      <option value="Month">Month (Mois)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description détaillée de l'article ou service…"
                rows={3}
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {/* ── Type & Usage ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Type & Usage</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <input type="checkbox" checked={form.is_stock_item === 1}
                onChange={(e) => setForm(p => ({ ...p, is_stock_item: e.target.checked ? 1 : 0 }))}
                className="rounded border-gray-300 text-cobilan-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Article en stock</p>
                <p className="text-xs text-gray-500">Produit physique qui affecte les niveaux de stock</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <input type="checkbox" checked={form.is_sales_item === 1}
                onChange={(e) => setForm(p => ({ ...p, is_sales_item: e.target.checked ? 1 : 0 }))}
                className="rounded border-gray-300 text-cobilan-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Article de vente</p>
                <p className="text-xs text-gray-500">Disponible dans les factures et devis de vente</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <input type="checkbox" checked={form.is_purchase_item === 1}
                onChange={(e) => setForm(p => ({ ...p, is_purchase_item: e.target.checked ? 1 : 0 }))}
                className="rounded border-gray-300 text-cobilan-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Article d'achat</p>
                <p className="text-xs text-gray-500">Disponible dans les factures et commandes d'achat</p>
              </div>
            </label>
          </div>
        </div>

        {/* ── Prix ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Prix</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente standard (MAD)</label>
              <input type="number" min="0" step="0.01" value={form.standard_rate}
                onChange={(e) => setForm(p => ({ ...p, standard_rate: Number(e.target.value) }))}
                className={inputCls} />
            </div>
            {form.is_stock_item === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valeur de stock (MAD)</label>
                <input type="number" min="0" step="0.01" value={form.valuation_rate}
                  onChange={(e) => setForm(p => ({ ...p, valuation_rate: Number(e.target.value) }))}
                  className={inputCls} />
              </div>
            )}
          </div>
        </div>

        {/* ── Comptabilité ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Comptabilité</h2>
          <div className="space-y-4">
            {form.is_sales_item === 1 && incomeAccounts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compte de revenus</label>
                <select value={form.income_account}
                  onChange={(e) => setForm(p => ({ ...p, income_account: e.target.value }))}
                  className={inputCls}>
                  <option value="">— Par défaut société —</option>
                  {incomeAccounts.map(acc => (
                    <option key={acc.name} value={acc.name}>{acc.account_name} ({acc.name})</option>
                  ))}
                </select>
              </div>
            )}
            {form.is_purchase_item === 1 && expenseAccounts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compte de charges</label>
                <select value={form.expense_account}
                  onChange={(e) => setForm(p => ({ ...p, expense_account: e.target.value }))}
                  className={inputCls}>
                  <option value="">— Par défaut société —</option>
                  {expenseAccounts.map(acc => (
                    <option key={acc.name} value={acc.name}>{acc.account_name} ({acc.name})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template de taxe article</label>
              <select value={form.item_tax_template}
                onChange={(e) => setForm(p => ({ ...p, item_tax_template: e.target.value }))}
                className={inputCls}>
                <option value="">— Aucun (taxe du document) —</option>
                {taxTemplates.map(t => (
                  <option key={t.name} value={t.name}>{t.title || t.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Si défini, ce taux surcharge le template de taxes de la facture pour cet article
              </p>
            </div>
          </div>
        </div>

        {/* ── Statut ── */}
        {isEdit && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Statut</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.disabled === 1}
                onChange={(e) => setForm(p => ({ ...p, disabled: e.target.checked ? 1 : 0 }))}
                className="rounded border-gray-300 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Désactiver cet article</p>
                <p className="text-xs text-gray-500">L'article n'apparaîtra plus dans les formulaires de factures</p>
              </div>
            </label>
          </div>
        )}

        {/* ── Boutons ── */}
        <div className="flex gap-3 pb-8">
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="px-6 py-2.5 bg-cobilan-600 text-white text-sm font-semibold rounded-lg hover:bg-cobilan-700 disabled:opacity-50 transition flex items-center gap-2">
            {saving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isEdit ? 'Enregistrer' : 'Créer l\'article'}
          </button>
          <button type="button" onClick={() => navigate('/articles')}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

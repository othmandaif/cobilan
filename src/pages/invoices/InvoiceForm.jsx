import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import invoiceService from '../../api/invoices';
import OcrUploader from '../../components/OcrUploader';
import { toast } from '../../components/toast';
import { PageLoader } from '../../components/skeletons';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount || 0) + ' MAD';
}

const NAMING_SERIES = ['ACC-SINV-.YYYY.-', 'SINV-.YYYY.-', 'FAC-.YYYY.-'];

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transition-all duration-150 ease-out scale-100 opacity-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddCompanyModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ company_name: '', abbr: '', country: 'Morocco', default_currency: 'MAD' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.company_name.trim()) { setError('Le nom est obligatoire'); return; }
    if (!form.abbr.trim()) { setError("L'abréviation est obligatoire"); return; }
    setSaving(true); setError('');
    try {
      const result = await invoiceService.createCompany(form);
      onCreated(result);
      setForm({ company_name: '', abbr: '', country: 'Morocco', default_currency: 'MAD' });
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { setError(JSON.parse(JSON.parse(msg)[0]).message); } catch { setError('Erreur'); } }
      else setError(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition";

  return (
    <Modal open={open} title="Nouvelle société" onClose={onClose}>
      {error && <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
          <input type="text" value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))}
            placeholder="Ex: Ma Société SARL" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Abréviation <span className="text-red-500">*</span></label>
          <input type="text" value={form.abbr}
            onChange={(e) => setForm(p => ({ ...p, abbr: e.target.value.toUpperCase().slice(0, 5) }))}
            placeholder="Ex: MS" maxLength={5} className={inputCls} />
          <p className="mt-1 text-xs text-gray-400">2-5 caractères</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
            <input type="text" value={form.country} onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <input type="text" value={form.default_currency}
              onChange={(e) => setForm(p => ({ ...p, default_currency: e.target.value.toUpperCase() }))} className={inputCls} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cobilan-600 to-cobilan-700 text-white text-sm font-semibold rounded-xl hover:from-cobilan-700 hover:to-cobilan-800 disabled:opacity-50 shadow-lg shadow-cobilan-500/20 active:scale-[0.98] transition-all">
            {saving ? 'Création…' : 'Créer la société'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition active:scale-[0.98]">Annuler</button>
        </div>
      </div>
    </Modal>
  );
}

function AddCustomerModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ customer_name: '', customer_type: 'Company', mobile_no: '', email_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.customer_name.trim()) { setError('Le nom est obligatoire'); return; }
    setSaving(true); setError('');
    try {
      const result = await invoiceService.createCustomer({
        ...form, customer_group: 'Commercial', territory: 'Morocco', default_currency: 'MAD',
      });
      onCreated(result);
      setForm({ customer_name: '', customer_type: 'Company', mobile_no: '', email_id: '' });
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { setError(JSON.parse(JSON.parse(msg)[0]).message); } catch { setError('Erreur'); } }
      else setError(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition";
  const selectCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition";

  return (
    <Modal open={open} title="Nouveau client" onClose={onClose}>
      {error && <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
          <input type="text" value={form.customer_name} onChange={(e) => setForm(p => ({ ...p, customer_name: e.target.value }))}
            placeholder="Ex: Société ABC SARL" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.customer_type} onChange={(e) => setForm(p => ({ ...p, customer_type: e.target.value }))}
            className={selectCls}>
            <option value="Company">Entreprise</option>
            <option value="Individual">Particulier</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={form.mobile_no} onChange={(e) => setForm(p => ({ ...p, mobile_no: e.target.value }))}
              placeholder="+212600000000" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email_id} onChange={(e) => setForm(p => ({ ...p, email_id: e.target.value }))}
              placeholder="contact@societe.ma" className={inputCls} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cobilan-600 to-cobilan-700 text-white text-sm font-semibold rounded-xl hover:from-cobilan-700 hover:to-cobilan-800 disabled:opacity-50 shadow-lg shadow-cobilan-500/20 active:scale-[0.98] transition-all">
            {saving ? 'Création…' : 'Créer le client'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition active:scale-[0.98]">Annuler</button>
        </div>
      </div>
    </Modal>
  );
}

function SelectWithAdd({ value, onChange, options, optionValue = 'name', optionLabel = 'name', placeholder, onAdd }) {
  return (
    <div className="flex gap-2">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition">
        <option value="">— {placeholder} —</option>
        {options.map((o) => (
          <option key={o[optionValue]} value={o[optionValue]}>{o[optionLabel] || o.name}</option>
        ))}
      </select>
      {onAdd && (
        <button type="button" onClick={onAdd}
          className="px-3 py-2 text-xs font-medium text-cobilan-600 bg-cobilan-50 border border-cobilan-200 rounded-xl hover:bg-cobilan-100 transition whitespace-nowrap flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouveau
        </button>
      )}
    </div>
  );
}

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [taxTemplates, setTaxTemplates] = useState([]);
  const [incomeAccounts, setIncomeAccounts] = useState([]);
  const [defaultIncomeAccount, setDefaultIncomeAccount] = useState('');
  const [taxRate, setTaxRate] = useState(0);

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showOcr, setShowOcr] = useState(false);

  const [form, setForm] = useState({
    company: '',
    naming_series: 'ACC-SINV-.YYYY.-',
    customer: '',
    posting_date: todayStr(),
    due_date: addDays(todayStr(), 30),
    currency: 'MAD',
    taxes_and_charges: '',
    update_stock: 0,
    title: '',
    items: [{
      mode: 'catalog',
      item_code: '', item_name: '', qty: 1, rate: 0,
      description: '', warehouse: '', income_account: '',
    }],
  });

  useEffect(() => {
    loadAll();
    if (isEdit) loadInvoice();
  }, [id]);

  // Charger comptes de revenus quand société change
  useEffect(() => {
    if (!form.company) return;
    invoiceService.getIncomeAccounts(form.company).then(data => {
      const accounts = data || [];
      setIncomeAccounts(accounts);
      setDefaultIncomeAccount(accounts[0]?.name || '');
    }).catch(() => { });
  }, [form.company]);

  // Charger taux TVA quand template change
  useEffect(() => {
    if (!form.taxes_and_charges) { setTaxRate(0); return; }
    invoiceService.getTaxRate(form.taxes_and_charges)
      .then(rate => setTaxRate(rate))
      .catch(() => setTaxRate(0));
  }, [form.taxes_and_charges]);

  const loadAll = async () => {
    try {
      const [comp, cust, items, taxes] = await Promise.all([
        invoiceService.getCompanies(),
        invoiceService.getCustomers(),
        invoiceService.getItems(),
        invoiceService.getTaxTemplates(),
      ]);
      const companiesList = comp || [];
      setCompanies(companiesList);
      setCustomers(cust || []);
      setCatalogItems(items || []);
      setTaxTemplates(taxes || []);
      if (!isEdit && companiesList.length > 0) {
        setForm(prev => ({ ...prev, company: companiesList[0].name }));
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    }
  };

  const loadInvoice = async () => {
    try {
      const data = await invoiceService.getById(id);
      if (data.docstatus !== 0) {
        navigate(`/factures-vente/${encodeURIComponent(id)}`);
        return;
      }
      setForm({
        company: data.company || '',
        naming_series: data.naming_series || 'ACC-SINV-.YYYY.-',
        customer: data.customer || '',
        posting_date: data.posting_date || todayStr(),
        due_date: data.due_date || addDays(todayStr(), 30),
        currency: data.currency || 'MAD',
        taxes_and_charges: data.taxes_and_charges || '',
        update_stock: data.update_stock || 0,
        title: data.title || '',
        items: (data.items || []).map(item => ({
          // ← FIX : mode basé sur item_code
          mode: item.item_code ? 'catalog' : 'manual',
          item_code: item.item_code || '',
          item_name: item.item_name || '',
          qty: item.qty || 1,
          rate: item.rate || 0,
          description: item.description || '',
          warehouse: item.warehouse || '',
          income_account: item.income_account || '',
        })),
      });
    } catch {
      setError('Facture introuvable');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyCreated = (company) => {
    setCompanies(prev => [...prev, company]);
    setForm(prev => ({ ...prev, company: company.name }));
    setShowAddCompany(false);
  };

  const handleCustomerCreated = (customer) => {
    setCustomers(prev => [...prev, { name: customer.name, customer_name: customer.customer_name }]);
    setForm(prev => ({ ...prev, customer: customer.name }));
    setShowAddCustomer(false);
  };

  const handleOcrResult = (data) => {
    setForm(prev => ({
      ...prev,
      company: data.company_name || prev.company,
      posting_date: data.posting_date || prev.posting_date,
      due_date: data.due_date || prev.due_date,
      title: data.invoice_number ? `Facture ${data.invoice_number}` : prev.title,
      items: data.items.length > 0 ? data.items.map(item => ({
        mode: 'manual',
        item_code: '',
        item_name: item.item_name || '',
        qty: item.qty || 1,
        rate: item.rate || 0,
        description: '',
        warehouse: '',
        income_account: defaultIncomeAccount,
      })) : prev.items,
    }));
    toast.success('Champs pré-remplis depuis l\'OCR');
  };

  const selectCatalogItem = (index, itemCode) => {
    const selected = catalogItems.find(it => it.name === itemCode);
    if (selected) {
      setForm(prev => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          item_code: selected.name,
          item_name: selected.item_name,
          rate: selected.standard_rate || 0,
        };
        return { ...prev, items: newItems };
      });
    }
  };

  const toggleMode = (index, mode) => {
    setForm(prev => {
      const newItems = [...prev.items];
      const current = newItems[index];
      newItems[index] = {
        mode,
        item_code: '',
        item_name: '',
        qty: current.qty,
        rate: mode === 'catalog' ? 0 : current.rate,
        description: current.description,
        warehouse: '',
        income_account: '',
      };
      return { ...prev, items: newItems };
    });
  };

  const addLine = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        mode: 'catalog', item_code: '', item_name: '',
        qty: 1, rate: 0, description: '', warehouse: '', income_account: '',
      }],
    }));
  };

  const removeLine = (index) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const subtotal = form.items.reduce((sum, item) => sum + (item.qty || 0) * (item.rate || 0), 0);
  const taxAmount = subtotal * taxRate / 100;
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = async () => {
    setError('');
    if (!form.company) { setError('Veuillez sélectionner une société'); return; }
    if (!form.customer) { setError('Veuillez sélectionner un client'); return; }

    const validItems = form.items.filter(item =>
      item.mode === 'catalog' ? item.item_code : item.item_name
    );
    if (validItems.length === 0) { setError('Ajoutez au moins un article'); return; }

    setSaving(true);
    try {
      const payload = {
        company: form.company,
        naming_series: form.naming_series,
        customer: form.customer,
        posting_date: form.posting_date,
        due_date: form.due_date,
        currency: form.currency,
        title: form.title || '',
        update_stock: form.update_stock,
        items: validItems.map(item => {
          if (item.mode === 'catalog') {
            return {
              item_code: item.item_code,
              qty: Number(item.qty) || 1,
              rate: Number(item.rate) || 0,
              description: item.description || '',
              ...(item.warehouse && { warehouse: item.warehouse }),
            };
          }
          return {
            item_name: item.item_name,
            description: item.description || item.item_name,
            qty: Number(item.qty) || 1,
            rate: Number(item.rate) || 0,
            uom: 'Nos',
            income_account: item.income_account || defaultIncomeAccount,
          };
        }),
        ...(form.taxes_and_charges && { taxes_and_charges: form.taxes_and_charges }),
      };

      if (isEdit) {
        await invoiceService.update(id, payload);
        navigate(`/factures-vente/${encodeURIComponent(id)}`);
      } else {
        const result = await invoiceService.create(payload);
        navigate(`/factures-vente/${encodeURIComponent(result.name)}`);
      }
    } catch (err) {
      const serverMessages = err.response?.data?._server_messages;
      if (serverMessages) {
        try {
          const parsed = JSON.parse(serverMessages);
          const first = JSON.parse(parsed[0]);
          setError(first.message || 'Erreur ERPNext');
        } catch { setError('Erreur lors de la sauvegarde'); }
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader message="Chargement de la facture…" />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/factures-vente')}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition tooltip-icon"
          aria-label="Retour">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {isEdit ? 'Modifier la facture' : 'Nouvelle facture de vente'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Modifiez les informations ci-dessous' : 'Remplissez les champs pour créer une nouvelle facture'}
          </p>
        </div>
        <button onClick={() => setShowOcr(true)}
          className="px-3 py-2 text-xs font-semibold text-cobilan-600 bg-cobilan-50 border border-cobilan-200 rounded-xl hover:bg-cobilan-100 transition active:scale-[0.98] flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5M3.75 4.5l2.25 15h12l2.25-15M3.75 4.5h16.5m-16.5 0l.563-3.375A1.5 1.5 0 015.888 0h12.224a1.5 1.5 0 011.325 1.125L20.25 4.5" />
          </svg>
          OCR
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3.5 flex items-start gap-3 text-sm text-red-700">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">

        {/* ── En-tête ── */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-cobilan-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-cobilan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
              </svg>
            </div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">En-tête</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Société <span className="text-red-500">*</span></label>
              <SelectWithAdd value={form.company} onChange={(v) => setForm(p => ({ ...p, company: v }))}
                options={companies} optionValue="name" optionLabel="company_name"
                placeholder="Sélectionner une société" onAdd={() => setShowAddCompany(true)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Séries <span className="text-red-500">*</span></label>
              <select value={form.naming_series} onChange={(e) => setForm(p => ({ ...p, naming_series: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition">
                {NAMING_SERIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client <span className="text-red-500">*</span></label>
              <SelectWithAdd value={form.customer} onChange={(v) => setForm(p => ({ ...p, customer: v }))}
                options={customers} optionValue="name" optionLabel="customer_name"
                placeholder="Sélectionner un client" onAdd={() => setShowAddCustomer(true)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de comptabilisation <span className="text-red-500">*</span></label>
              <input type="date" value={form.posting_date}
                onChange={(e) => setForm(p => ({ ...p, posting_date: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance <span className="text-red-500">*</span></label>
              <input type="date" value={form.due_date}
                onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre (optionnel)</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Facture janvier 2024"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition" />
            </div>
          </div>
        </div>

        {/* ── Articles ── */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cobilan-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-cobilan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Articles</h2>
              <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">{form.items.length}</span>
            </div>
            <button type="button" onClick={addLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cobilan-600 border border-dashed border-cobilan-300 rounded-lg hover:bg-cobilan-50 hover:border-cobilan-400 transition">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ajouter une ligne
            </button>
          </div>

          <label className="relative inline-flex items-center gap-3 mb-5 cursor-pointer group">
            <input type="checkbox" checked={form.update_stock === 1}
              onChange={(e) => setForm(p => ({ ...p, update_stock: e.target.checked ? 1 : 0 }))}
              className="sr-only peer" />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-cobilan-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cobilan-500/30 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white transition-all" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">Mettre à jour le stock</span>
          </label>

          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div key={index} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-200 transition">

                {/* Toggle mode */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-300 font-mono w-5">{index + 1}</span>
                  <button type="button"
                    onClick={() => item.mode !== 'catalog' && toggleMode(index, 'catalog')}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition ${item.mode === 'catalog' ? 'bg-cobilan-100 text-cobilan-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    Catalogue
                  </button>
                  <button type="button"
                    onClick={() => item.mode !== 'manual' && toggleMode(index, 'manual')}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition ${item.mode === 'manual' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    Saisie libre
                  </button>
                  <span className="text-xs text-gray-400">
                    {item.mode === 'manual' ? 'Article hors catalogue' : 'Article existant'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Article */}
                  <div className="sm:col-span-5">
                    {item.mode === 'catalog' ? (
                      <select value={item.item_code} onChange={(e) => selectCatalogItem(index, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500">
                        <option value="">— Choisir un article —</option>
                        {catalogItems.map(it => (
                          <option key={it.name} value={it.name}>
                            {it.item_name} — {new Intl.NumberFormat('fr-MA').format(it.standard_rate || 0)} MAD
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" placeholder="Nom de l'article" value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500" />
                    )}
                  </div>

                  {/* Quantité */}
                  <div className="sm:col-span-2">
                    <input type="number" min="0" step="0.001" value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                      placeholder="Qté"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500 text-center" />
                  </div>

                  {/* Prix */}
                  <div className="sm:col-span-2">
                    <input type="number" min="0" step="0.01" value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                      placeholder="Prix"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500 text-right" />
                  </div>

                  {/* Montant */}
                  <div className="sm:col-span-2 flex items-center justify-end">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatMAD((item.qty || 0) * (item.rate || 0))}
                    </p>
                  </div>

                  {/* Supprimer */}
                  <div className="sm:col-span-1 flex items-center justify-end">
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeLine(index)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition tooltip-icon"
                        aria-label="Supprimer la ligne">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mt-2">
                  <input type="text" placeholder="Description (optionnel)" value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500 text-gray-600" />
                </div>

                {/* ← FIX : compte de revenus uniquement pour saisie libre */}
                {item.mode === 'manual' && incomeAccounts.length > 0 && (
                  <div className="mt-2">
                    <select
                      value={item.income_account || defaultIncomeAccount}
                      onChange={(e) => updateItem(index, 'income_account', e.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500 text-gray-700">
                      <option value="">— Compte de revenus —</option>
                      {incomeAccounts.map(acc => (
                        <option key={acc.name} value={acc.name}>{acc.account_name} ({acc.name})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Entrepôt si stock activé */}
                {form.update_stock === 1 && item.mode === 'catalog' && (
                  <div className="mt-2">
                    <input type="text" placeholder="Entrepôt (ex: Stores - CB)" value={item.warehouse}
                      onChange={(e) => updateItem(index, 'warehouse', e.target.value)}
                      className="w-full rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-between items-center px-1 text-sm">
            <span className="text-gray-500">Total lignes : <strong className="text-gray-900">{form.items.reduce((s, i) => s + (Number(i.qty) || 0), 0)}</strong> articles</span>
            <span className="text-gray-500">Total HT : <strong className="text-gray-900 tabular-nums">{formatMAD(subtotal)}</strong></span>
          </div>
        </div>

        {/* ── Taxes ── */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-cobilan-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-cobilan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.5c0-1.115.657-2.078 1.597-2.54a7.5 7.5 0 016.806 0A2.258 2.258 0 0012 1.5c.758 0 1.449.308 1.946.803l.054.054a2.25 2.25 0 002.25.63 2.25 2.25 0 011.5 2.25v10.5a6.001 6.001 0 00-6 6 6.001 6.001 0 00-6-6" />
              </svg>
            </div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Taxes et frais</h2>
          </div>
          <select value={form.taxes_and_charges}
            onChange={(e) => setForm(p => ({ ...p, taxes_and_charges: e.target.value }))}
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500">
            <option value="">— Sans taxe (HT) —</option>
            {taxTemplates.map(t => <option key={t.name} value={t.name}>{t.title || t.name}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-400">Le modèle applique automatiquement la TVA selon le paramétrage ERPNext</p>
        </div>

        {/* ── Totaux ── */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-cobilan-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-cobilan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Totaux</h2>
          </div>
          <div className="bg-gray-50/50 rounded-xl p-5 max-w-sm ml-auto">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total HT</span>
                <span className="font-medium tabular-nums">{formatMAD(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">TVA ({taxRate}%)</span>
                  <span className="font-medium tabular-nums">{formatMAD(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-200">
                <span className="text-gray-900">Total TTC</span>
                <span className="text-cobilan-700 tabular-nums">{formatMAD(grandTotal)}</span>
              </div>
            </div>
            {taxRate > 0 && (
              <p className="text-xs text-gray-400 text-right mt-3">* Montant exact calculé par ERPNext</p>
            )}
          </div>
        </div>

        {/* ── Boutons ── */}
        <div className="flex items-center gap-3 pb-8 pt-2">
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cobilan-600 to-cobilan-700 text-white text-sm font-semibold rounded-xl hover:from-cobilan-700 hover:to-cobilan-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cobilan-500/20 active:scale-[0.98] transition-all">
            {saving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isEdit ? 'Enregistrer' : 'Créer la facture'}
          </button>
          <button type="button" onClick={() => navigate('/factures-vente')}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition active:scale-[0.98]">
            Annuler
          </button>
        </div>
      </div>

      <AddCompanyModal open={showAddCompany} onClose={() => setShowAddCompany(false)} onCreated={handleCompanyCreated} />
      <AddCustomerModal open={showAddCustomer} onClose={() => setShowAddCustomer(false)} onCreated={handleCustomerCreated} />
      {showOcr && <OcrUploader onResult={handleOcrResult} onClose={() => setShowOcr(false)} />}
    </div>
  );
}
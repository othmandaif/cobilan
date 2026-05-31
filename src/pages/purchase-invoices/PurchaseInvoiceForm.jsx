import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import purchaseInvoiceService from '../../api/purchaseInvoices';
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

const NAMING_SERIES = ['ACC-PINV-.YYYY.-', 'PINV-.YYYY.-'];

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-modal-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
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
      const result = await purchaseInvoiceService.createCompany(form);
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
          <input type="text" value={form.company_name}
            onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))}
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
            <input type="text" value={form.country}
              onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))} className={inputCls} />
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

function AddSupplierModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ supplier_name: '', supplier_type: 'Company', mobile_no: '', email_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.supplier_name.trim()) { setError('Le nom est obligatoire'); return; }
    setSaving(true); setError('');
    try {
      const result = await purchaseInvoiceService.createSupplier({
        ...form,
        supplier_group: 'All Supplier Groups',
        country: 'Morocco',
        default_currency: 'MAD',
      });
      onCreated(result);
      setForm({ supplier_name: '', supplier_type: 'Company', mobile_no: '', email_id: '' });
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { setError(JSON.parse(JSON.parse(msg)[0]).message); } catch { setError('Erreur'); } }
      else setError(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition";
  const selectCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition";

  return (
    <Modal open={open} title="Nouveau fournisseur" onClose={onClose}>
      {error && <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
          <input type="text" value={form.supplier_name}
            onChange={(e) => setForm(p => ({ ...p, supplier_name: e.target.value }))}
            placeholder="Ex: Fournisseur XYZ SARL" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.supplier_type}
            onChange={(e) => setForm(p => ({ ...p, supplier_type: e.target.value }))}
            className={selectCls}>
            <option value="Company">Entreprise</option>
            <option value="Individual">Particulier</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={form.mobile_no}
              onChange={(e) => setForm(p => ({ ...p, mobile_no: e.target.value }))}
              placeholder="+212600000000" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email_id}
              onChange={(e) => setForm(p => ({ ...p, email_id: e.target.value }))}
              placeholder="contact@fournisseur.ma" className={inputCls} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cobilan-600 to-cobilan-700 text-white text-sm font-semibold rounded-xl hover:from-cobilan-700 hover:to-cobilan-800 disabled:opacity-50 shadow-lg shadow-cobilan-500/20 active:scale-[0.98] transition-all">
            {saving ? 'Création…' : 'Créer le fournisseur'}
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

export default function PurchaseInvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [companies, setCompanies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [taxTemplates, setTaxTemplates] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [defaultExpenseAccount, setDefaultExpenseAccount] = useState('');
  const [taxRate, setTaxRate] = useState(0);

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showOcr, setShowOcr] = useState(false);

  const [form, setForm] = useState({
    company: '',
    naming_series: 'ACC-PINV-.YYYY.-',
    supplier: '',
    posting_date: todayStr(),
    due_date: addDays(todayStr(), 30),
    bill_no: '',
    bill_date: '',
    currency: 'MAD',
    taxes_and_charges: '',
    update_stock: 0,
    title: '',
    items: [{
      mode: 'catalog', item_code: '', item_name: '', qty: 1,
      rate: 0, description: '', warehouse: '', expense_account: '',
    }],
  });

  useEffect(() => {
    loadAll();
    if (isEdit) loadInvoice();
  }, [id]);

  // Charger comptes de charges quand société change
  useEffect(() => {
    if (!form.company) return;
    purchaseInvoiceService.getExpenseAccounts(form.company).then(data => {
      const accounts = data || [];
      setExpenseAccounts(accounts);
      setDefaultExpenseAccount(accounts[0]?.name || '');
    }).catch(() => {});
  }, [form.company]);

  // Charger taux TVA quand template change
  useEffect(() => {
    if (!form.taxes_and_charges) { setTaxRate(0); return; }
    purchaseInvoiceService.getTaxRate(form.taxes_and_charges)
      .then(rate => setTaxRate(rate))
      .catch(() => setTaxRate(0));
  }, [form.taxes_and_charges]);

  const loadAll = async () => {
    try {
      const [comp, supp, items, taxes] = await Promise.all([
        purchaseInvoiceService.getCompanies(),
        purchaseInvoiceService.getSuppliers(),
        purchaseInvoiceService.getItems(),
        purchaseInvoiceService.getTaxTemplates(),
      ]);
      const companyList = comp || [];
      setCompanies(companyList);
      setSuppliers(supp || []);
      setCatalogItems(items || []);
      setTaxTemplates(taxes || []);
      if (!isEdit && companyList.length > 0) {
        setForm(prev => ({ ...prev, company: companyList[0].name }));
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    }
  };

  const loadInvoice = async () => {
    try {
      const data = await purchaseInvoiceService.getById(id);
      if (data.docstatus !== 0) {
        navigate(`/factures-achat/${encodeURIComponent(id)}`);
        return;
      }
      setForm({
        company: data.company || '',
        naming_series: data.naming_series || 'ACC-PINV-.YYYY.-',
        supplier: data.supplier || '',
        posting_date: data.posting_date || todayStr(),
        due_date: data.due_date || addDays(todayStr(), 30),
        bill_no: data.bill_no || '',
        bill_date: data.bill_date || '',
        currency: data.currency || 'MAD',
        taxes_and_charges: data.taxes_and_charges || '',
        update_stock: data.update_stock || 0,
        title: data.title || '',
        items: (data.items || []).map(item => ({
          mode: item.item_code ? 'catalog' : 'manual',
          item_code: item.item_code || '',
          item_name: item.item_name || '',
          qty: item.qty || 1,
          rate: item.rate || 0,
          description: item.description || '',
          warehouse: item.warehouse || '',
          expense_account: item.expense_account || '',
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

  const handleSupplierCreated = (supplier) => {
    setSuppliers(prev => [...prev, { name: supplier.name, supplier_name: supplier.supplier_name }]);
    setForm(prev => ({ ...prev, supplier: supplier.name }));
    setShowAddSupplier(false);
  };

  const handleOcrResult = (data) => {
    setForm(prev => ({
      ...prev,
      company: data.company_name || prev.company,
      posting_date: data.posting_date || prev.posting_date,
      due_date: data.due_date || prev.due_date,
      bill_no: data.bill_no || prev.bill_no,
      bill_date: data.posting_date || prev.bill_date,
      title: data.invoice_number ? `Facture ${data.invoice_number}` : prev.title,
      items: data.items.length > 0 ? data.items.map(item => ({
        mode: 'manual',
        item_code: '',
        item_name: item.item_name || '',
        qty: item.qty || 1,
        rate: item.rate || 0,
        description: '',
        warehouse: '',
        expense_account: defaultExpenseAccount,
      })) : prev.items,
    }));
    toast.success('Champs pré-remplis depuis l\'OCR');
  };

  const updateItem = (index, field, value) => {
    setForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
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
        expense_account: '',
      };
      return { ...prev, items: newItems };
    });
  };

  const addLine = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        mode: 'catalog', item_code: '', item_name: '',
        qty: 1, rate: 0, description: '', warehouse: '', expense_account: '',
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
    if (!form.supplier) { setError('Veuillez sélectionner un fournisseur'); return; }

    const validItems = form.items.filter(item =>
      item.mode === 'catalog' ? item.item_code : item.item_name
    );
    if (validItems.length === 0) { setError('Ajoutez au moins un article'); return; }

    setSaving(true);
    try {
      const payload = {
        company: form.company,
        naming_series: form.naming_series,
        supplier: form.supplier,
        posting_date: form.posting_date,
        due_date: form.due_date,
        currency: form.currency,
        title: form.title || '',
        update_stock: form.update_stock,
        ...(form.bill_no && { bill_no: form.bill_no }),
        ...(form.bill_date && { bill_date: form.bill_date }),
        items: validItems.map(item => {
          if (item.mode === 'catalog') {
            return {
              item_code: item.item_code,
              qty: Number(item.qty) || 1,
              rate: Number(item.rate) || 0,
              description: item.description || '',
              expense_account: item.expense_account || defaultExpenseAccount,
              ...(item.warehouse && { warehouse: item.warehouse }),
            };
          }
          return {
            item_name: item.item_name,
            description: item.description || item.item_name,
            qty: Number(item.qty) || 1,
            rate: Number(item.rate) || 0,
            uom: 'Nos',
            expense_account: item.expense_account || defaultExpenseAccount,
          };
        }),
        ...(form.taxes_and_charges && { taxes_and_charges: form.taxes_and_charges }),
      };

      if (isEdit) {
        await purchaseInvoiceService.update(id, payload);
        navigate(`/factures-achat/${encodeURIComponent(id)}`);
      } else {
        const result = await purchaseInvoiceService.create(payload);
        navigate(`/factures-achat/${encodeURIComponent(result.name)}`);
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
        <button onClick={() => navigate('/factures-achat')}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition tooltip-icon"
          aria-label="Retour">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {isEdit ? 'Modifier la facture' : "Nouvelle facture d'achat"}
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-cobilan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900">En-tête</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur <span className="text-red-500">*</span></label>
              <SelectWithAdd value={form.supplier} onChange={(v) => setForm(p => ({ ...p, supplier: v }))}
                options={suppliers} optionValue="name" optionLabel="supplier_name"
                placeholder="Sélectionner un fournisseur" onAdd={() => setShowAddSupplier(true)} />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° facture fournisseur</label>
              <input type="text" value={form.bill_no}
                onChange={(e) => setForm(p => ({ ...p, bill_no: e.target.value }))}
                placeholder="Ex: FA-2024-001"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date facture fournisseur</label>
              <input type="date" value={form.bill_date}
                onChange={(e) => setForm(p => ({ ...p, bill_date: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre (optionnel)</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Achat fournitures janvier 2024"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition" />
            </div>
          </div>
        </div>

        {/* ── Articles ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-cobilan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900">Articles</h2>
          </div>

          <div className="flex items-center justify-between mb-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.update_stock === 1}
                onChange={(e) => setForm(p => ({ ...p, update_stock: e.target.checked ? 1 : 0 }))}
                className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cobilan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cobilan-600"></div>
              <span className="ms-2 text-sm text-gray-600">Mettre à jour le stock</span>
            </label>
            <button type="button" onClick={addLine}
              className="text-sm text-cobilan-600 hover:text-cobilan-800 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                {/* Toggle mode */}
                <div className="flex items-center gap-2 mb-3">
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
                  <div className="sm:col-span-5">
                    {item.mode === 'catalog' ? (
                      <select value={item.item_code} onChange={(e) => selectCatalogItem(index, e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition">
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
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition" />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <input type="number" min="0" step="0.001" value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                      placeholder="Qté"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition text-center" />
                  </div>
                  <div className="sm:col-span-2">
                    <input type="number" min="0" step="0.01" value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                      placeholder="Prix"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition text-right" />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-end">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatMAD((item.qty || 0) * (item.rate || 0))}
                    </p>
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-end">
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeLine(index)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition">
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
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition text-gray-600" />
                </div>

                {/* Compte de charges */}
                {expenseAccounts.length > 0 && (
                  <div className="mt-2">
                    <select
                      value={item.expense_account || defaultExpenseAccount}
                      onChange={(e) => updateItem(index, 'expense_account', e.target.value)}
                      className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition text-gray-700">
                      <option value="">— Compte de charge —</option>
                      {expenseAccounts.map(acc => (
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
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center px-2 text-sm text-gray-500">
            <span>Quantité totale : <strong className="text-gray-900">{form.items.reduce((s, i) => s + (Number(i.qty) || 0), 0)}</strong></span>
            <span>Total HT : <strong className="text-gray-900">{formatMAD(subtotal)}</strong></span>
          </div>
        </div>

        {/* ── Taxes ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-cobilan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900">Taxes et Frais</h2>
          </div>
          <select value={form.taxes_and_charges}
            onChange={(e) => setForm(p => ({ ...p, taxes_and_charges: e.target.value }))}
            className="w-full max-w-md rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition">
            <option value="">— Sans taxe (HT) —</option>
            {taxTemplates.map(t => <option key={t.name} value={t.name}>{t.title || t.name}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-400">Le modèle applique automatiquement la TVA selon le paramétrage ERPNext</p>
        </div>

        {/* ── Totaux ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-cobilan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900">Totaux (MAD)</h2>
          </div>
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total HT</span>
              <span className="font-medium">{formatMAD(subtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">TVA ({taxRate}%)</span>
                <span className="font-medium">{formatMAD(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
              <span>Total TTC (MAD)</span>
              <span>{formatMAD(grandTotal)}</span>
            </div>
            {taxRate > 0 && (
              <p className="text-xs text-gray-400 text-right">* Estimation — montant exact calculé par ERPNext</p>
            )}
          </div>
        </div>

        {/* ── Boutons ── */}
        <div className="flex gap-3 pb-8">
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-cobilan-600 to-cobilan-700 text-white text-sm font-semibold rounded-xl hover:from-cobilan-700 hover:to-cobilan-800 disabled:opacity-50 shadow-lg shadow-cobilan-500/20 active:scale-[0.98] transition-all flex items-center gap-2">
            {saving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isEdit ? 'Enregistrer' : "Créer la facture"}
          </button>
          <button type="button" onClick={() => navigate('/factures-achat')}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition active:scale-[0.98]">
            Annuler
          </button>
        </div>
      </div>

      <AddCompanyModal open={showAddCompany} onClose={() => setShowAddCompany(false)} onCreated={handleCompanyCreated} />
      <AddSupplierModal open={showAddSupplier} onClose={() => setShowAddSupplier(false)} onCreated={handleSupplierCreated} />
      {showOcr && <OcrUploader onResult={handleOcrResult} onClose={() => setShowOcr(false)} />}
    </div>
  );
}
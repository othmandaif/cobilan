import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentService from '../../api/payments';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function formatMAD(a) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(a || 0) + ' MAD';
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500";

export default function PaymentForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [parties, setParties] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [modes, setModes] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const [form, setForm] = useState({
    company: '',
    payment_type: 'Receive',
    party_type: 'Customer',
    party: '',
    posting_date: todayStr(),
    paid_amount: 0,
    mode_of_payment: 'Cash',
    reference_no: '',
    reference_date: todayStr(),
    paid_from: '',
    paid_to: '',
  });

  useEffect(() => { loadMeta(); }, []);

  useEffect(() => {
    if (form.company) loadBankAccounts(form.company);
  }, [form.company]);

  useEffect(() => {
    if (form.party_type) loadParties(form.party_type);
  }, [form.party_type]);

  useEffect(() => {
    if (form.party && form.party_type) loadUnpaidInvoices();
  }, [form.party, form.party_type]);

  const loadMeta = async () => {
    try {
      const [comp, modes] = await Promise.all([
        paymentService.getCompanies(),
        paymentService.getModes(),
      ]);
      setCompanies(comp || []);
      setModes(modes || []);
      if (comp?.length > 0) setForm(p => ({ ...p, company: comp[0].name }));
    } catch {}
  };

  const loadParties = async (partyType) => {
    try {
      const data = partyType === 'Customer'
        ? await paymentService.getCustomers()
        : await paymentService.getSuppliers();
      setParties(data || []);
    } catch {}
  };

  const loadBankAccounts = async (company) => {
    try {
      const data = await paymentService.getBankAccounts(company);
      setBankAccounts(data || []);
      if (data?.length > 0) {
        setForm(p => ({
          ...p,
          paid_to: form.payment_type === 'Receive' ? data[0].name : p.paid_to,
          paid_from: form.payment_type === 'Pay' ? data[0].name : p.paid_from,
        }));
      }
    } catch {}
  };

  const loadUnpaidInvoices = async () => {
    try {
      const data = await paymentService.getUnpaidInvoices(form.party_type, form.party);
      setUnpaidInvoices(data || []);
      setSelectedInvoices([]);
    } catch {}
  };

  const toggleInvoice = (inv) => {
    setSelectedInvoices(prev => {
      const exists = prev.find(i => i.name === inv.name);
      if (exists) {
        const next = prev.filter(i => i.name !== inv.name);
        setForm(p => ({ ...p, paid_amount: next.reduce((s, i) => s + i.allocated, 0) }));
        return next;
      }
      const allocated = inv.outstanding_amount;
      const next = [...prev, { ...inv, allocated }];
      setForm(p => ({ ...p, paid_amount: next.reduce((s, i) => s + i.allocated, 0) }));
      return next;
    });
  };

  const updateAllocated = (name, value) => {
    setSelectedInvoices(prev => {
      const next = prev.map(i => i.name === name ? { ...i, allocated: Number(value) } : i);
      setForm(p => ({ ...p, paid_amount: next.reduce((s, i) => s + i.allocated, 0) }));
      return next;
    });
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.company) { setError('Société obligatoire'); return; }
    if (!form.party) { setError('Tiers obligatoire'); return; }
    if (!form.paid_amount || form.paid_amount <= 0) { setError('Montant obligatoire'); return; }

    setSaving(true);
    try {
      const doctype = form.party_type === 'Customer' ? 'Sales Invoice' : 'Purchase Invoice';
      const partyAccount = await paymentService.getPartyAccount(form.party_type, form.company);

      const payload = {
        company: form.company,
        payment_type: form.payment_type,
        party_type: form.party_type,
        party: form.party,
        posting_date: form.posting_date,
        paid_amount: Number(form.paid_amount),
        received_amount: Number(form.paid_amount),
        mode_of_payment: form.mode_of_payment,
        reference_no: form.reference_no || '',
        reference_date: form.reference_date || form.posting_date,
        paid_from: form.payment_type === 'Receive' ? partyAccount : (form.paid_from || bankAccounts[0]?.name || ''),
        paid_to: form.payment_type === 'Receive' ? (form.paid_to || bankAccounts[0]?.name || '') : partyAccount,
        paid_from_account_currency: 'MAD',
        paid_to_account_currency: 'MAD',
      };

      if (selectedInvoices.length > 0) {
        payload.references = selectedInvoices.map(inv => ({
          reference_doctype: doctype,
          reference_name: inv.name,
          allocated_amount: inv.allocated,
        }));
      }

      const result = await paymentService.create(payload);
      // Soumettre directement
      await paymentService.submit(result.name);
      navigate(`/paiements/${encodeURIComponent(result.name)}`);
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) { try { setError(JSON.parse(JSON.parse(msg)[0]).message); } catch { setError('Erreur'); } }
      else setError(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <button onClick={() => navigate('/paiements')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Nouveau paiement</h1>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-5">

        {/* ── En-tête ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Informations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Type de paiement */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de paiement</label>
              <div className="flex gap-3">
                {[
                  { value: 'Receive', label: '↓ Encaissement (client → moi)', color: 'green' },
                  { value: 'Pay', label: '↑ Décaissement (moi → fournisseur)', color: 'red' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(p => ({
                      ...p,
                      payment_type: opt.value,
                      party_type: opt.value === 'Receive' ? 'Customer' : 'Supplier',
                    }))}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition ${
                      form.payment_type === opt.value
                        ? opt.value === 'Receive'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Société */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Société <span className="text-red-500">*</span></label>
              <select value={form.company} onChange={(e) => setForm(p => ({ ...p, company: e.target.value }))} className={inputCls}>
                {companies.map(c => <option key={c.name} value={c.name}>{c.company_name || c.name}</option>)}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.posting_date}
                onChange={(e) => setForm(p => ({ ...p, posting_date: e.target.value }))} className={inputCls} />
            </div>

            {/* Tiers */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.payment_type === 'Receive' ? 'Client' : 'Fournisseur'} <span className="text-red-500">*</span>
              </label>
              <select value={form.party} onChange={(e) => setForm(p => ({ ...p, party: e.target.value }))} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {parties.map(p => (
                  <option key={p.name} value={p.name}>{p.customer_name || p.supplier_name} ({p.name})</option>
                ))}
              </select>
            </div>

            {/* Mode de paiement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
              <select value={form.mode_of_payment}
                onChange={(e) => setForm(p => ({ ...p, mode_of_payment: e.target.value }))} className={inputCls}>
                {modes.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                {modes.length === 0 && (
                  <>
                    <option value="Cash">Espèces</option>
                    <option value="Bank Transfer">Virement</option>
                    <option value="Cheque">Chèque</option>
                  </>
                )}
              </select>
            </div>

            {/* Compte bancaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.payment_type === 'Receive' ? 'Compte récepteur' : 'Compte émetteur'}
              </label>
              <select
                value={form.payment_type === 'Receive' ? form.paid_to : form.paid_from}
                onChange={(e) => setForm(p => ({
                  ...p,
                  [form.payment_type === 'Receive' ? 'paid_to' : 'paid_from']: e.target.value,
                }))} className={inputCls}>
                <option value="">— Choisir —</option>
                {bankAccounts.map(a => <option key={a.name} value={a.name}>{a.account_name} ({a.name})</option>)}
              </select>
            </div>

            {/* Référence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° référence</label>
              <input type="text" value={form.reference_no}
                onChange={(e) => setForm(p => ({ ...p, reference_no: e.target.value }))}
                placeholder="Ex: CHQ-001, VIR-002…" className={inputCls} />
            </div>

            {/* Date référence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date référence</label>
              <input type="date" value={form.reference_date}
                onChange={(e) => setForm(p => ({ ...p, reference_date: e.target.value }))} className={inputCls} />
            </div>
          </div>
        </div>

        {/* ── Lettrage des factures ── */}
        {form.party && unpaidInvoices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Lettrage des factures</h2>
            <p className="text-xs text-gray-400 mb-4">Cochez les factures à payer avec ce paiement</p>
            <div className="space-y-2">
              {unpaidInvoices.map(inv => {
                const selected = selectedInvoices.find(i => i.name === inv.name);
                return (
                  <div key={inv.name}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                      selected ? 'border-cobilan-300 bg-cobilan-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                    onClick={() => toggleInvoice(inv)}>
                    <input type="checkbox" checked={!!selected} onChange={() => {}}
                      className="rounded border-gray-300 text-cobilan-600 pointer-events-none" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                      <p className="text-xs text-gray-400">Échéance : {formatDate(inv.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Reste dû</p>
                      <p className="text-sm font-semibold text-orange-600">{formatMAD(inv.outstanding_amount)}</p>
                    </div>
                    {selected && (
                      <div className="w-28" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-xs text-gray-400 mb-0.5">Alloué</label>
                        <input type="number" min="0" step="0.01"
                          value={selected.allocated}
                          onChange={(e) => updateAllocated(inv.name, e.target.value)}
                          className="w-full rounded-lg border border-cobilan-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cobilan-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {form.party && unpaidInvoices.length === 0 && form.party && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            Aucune facture impayée pour ce tiers — le paiement sera enregistré sans lettrage.
          </div>
        )}

        {/* ── Montant ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Montant</h2>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant payé (MAD) <span className="text-red-500">*</span>
            </label>
            <input type="number" min="0" step="0.01" value={form.paid_amount}
              onChange={(e) => setForm(p => ({ ...p, paid_amount: Number(e.target.value) }))}
              className={`${inputCls} text-xl font-bold`} />
            {selectedInvoices.length > 0 && (
              <p className="mt-1 text-xs text-cobilan-600">
                Alloué à {selectedInvoices.length} facture{selectedInvoices.length > 1 ? 's' : ''} :
                {' '}{formatMAD(selectedInvoices.reduce((s, i) => s + i.allocated, 0))}
              </p>
            )}
          </div>
        </div>

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
            Enregistrer et soumettre
          </button>
          <button type="button" onClick={() => navigate('/paiements')}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

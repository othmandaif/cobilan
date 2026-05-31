import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import relanceService from '../../api/relances';
import { TableSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';
import { toast } from '../../components/toast';

function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount || 0) + ' MAD';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysOverdue(dateStr) {
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - due) / (1000 * 60 * 60 * 24));
}

const DURATION_FILTERS = [
  { label: 'Toutes', value: '' },
  { label: '1–7 jours', value: '1-7' },
  { label: '8–30 jours', value: '8-30' },
  { label: '+30 jours', value: '30+' },
];

function RelancePreviewModal({ invoice, open, onClose, onSend }) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !invoice) return;
    setLoading(true);
    setSending(false);
    const due = formatDate(invoice.due_date);
    setSubject(`Relance — Facture ${invoice.name}`);
    setContent(`Bonjour,\n\nNous vous rappelons que la facture ${invoice.name} d'un montant de ${formatMAD(invoice.outstanding_amount)} est arrivée à échéance le ${due} et reste impayée à ce jour.\n\nNous vous remercions de bien vouloir procéder au règlement dans les plus brefs délais.\n\nCordialement,`);
    relanceService.getCustomerEmail(invoice.customer)
      .then(setEmail)
      .catch(() => setEmail(''))
      .finally(() => setLoading(false));
  }, [open, invoice]);

  const handleSend = async () => {
    if (!email) { toast.warning("Le client n'a pas d'adresse email renseignée"); return; }
    if (!subject.trim() || !content.trim()) { toast.warning('Complétez le sujet et le contenu'); return; }
    setSending(true);
    try {
      await relanceService.sendRelance({ invoice, recipient: email, subject, content });
      toast.success(`Relance envoyée à ${invoice.customer_name}`);
      onSend(true);
      onClose();
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) {
        try { toast.error(JSON.parse(JSON.parse(msg)[0]).message); } catch { toast.error('Erreur lors de l\'envoi'); }
      } else {
        toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
      }
    } finally { setSending(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-modal-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Aperçu de la relance</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-3 border-cobilan-600 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="text-sm">
                <span className="text-gray-500">Destinataire : </span>
                <span className="font-medium text-gray-900">{email || 'Aucun email'}</span>
                {!email && <span className="text-xs text-red-500 ml-1">(obligatoire)</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
              <input type="text" value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={7}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition resize-y" />
            </div>

            <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Le PDF de la facture sera joint automatiquement à l'email (généré par ERPNext).</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSend} disabled={sending || !email}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cobilan-600 to-cobilan-700 text-white text-sm font-semibold rounded-xl hover:from-cobilan-700 hover:to-cobilan-800 disabled:opacity-50 shadow-lg shadow-cobilan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                {sending && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {sending ? 'Envoi en cours…' : 'Envoyer la relance'}
              </button>
              <button onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition active:scale-[0.98]">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BulkProgressModal({ open, total, sent, errors, onClose }) {
  if (!open) return null;
  const done = sent + errors;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const finished = done >= total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-modal-in">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {finished ? 'Relances terminées' : 'Envoi des relances…'}
        </h3>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              {sent} envoyée{sent > 1 ? 's' : ''}
              {errors > 0 && `, ${errors} erreur${errors > 1 ? 's' : ''}`}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-cobilan-600 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }} />
          </div>
        </div>

        {!finished && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4 text-cobilan-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Traitement de la relance {done + 1}/{total}…
          </div>
        )}

        {finished && (
          <button onClick={onClose}
            className="w-full px-4 py-2.5 bg-cobilan-600 text-white text-sm font-semibold rounded-xl hover:bg-cobilan-700 transition">
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}

export default function Relances() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relanceCounts, setRelanceCounts] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ total: 0, sent: 0, errors: 0 });

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await relanceService.getOverdueInvoices();
      setInvoices(data || []);
      if (data?.length) {
        relanceService.getRelanceCounts(data.map(i => i.name))
          .then(setRelanceCounts)
          .catch(() => {});
      } else {
        setRelanceCounts({});
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les factures impayées');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setSelected(new Set()); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filtered = invoices.filter(inv => {
    const d = daysOverdue(inv.due_date);
    if (search) {
      const q = search.toLowerCase();
      if (!inv.name.toLowerCase().includes(q) && !(inv.customer_name || '').toLowerCase().includes(q)) return false;
    }
    if (durationFilter === '1-7' && (d < 1 || d > 7)) return false;
    if (durationFilter === '8-30' && (d < 8 || d > 30)) return false;
    if (durationFilter === '30+' && d <= 30) return false;
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every(inv => selected.has(inv.name));

  const toggleSelect = (name) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(inv => inv.name)));
    }
  };

  const handleSendSingle = async (invoice) => {
    setPreviewInvoice(invoice);
  };

  const handleSingleSent = () => {
    setRelanceCounts(prev => ({
      ...prev,
      [previewInvoice.name]: (prev[previewInvoice.name] || 0) + 1,
    }));
  };

  const handleBulkSend = async () => {
    const toSend = filtered.filter(inv => selected.has(inv.name));
    if (!toSend.length) return;
    setBulkOpen(true);
    setBulkProgress({ total: toSend.length, sent: 0, errors: 0 });

    for (let i = 0; i < toSend.length; i++) {
      const inv = toSend[i];
      try {
        const email = await relanceService.getCustomerEmail(inv.customer);
        if (email) {
          const due = formatDate(inv.due_date);
          await relanceService.sendRelance({
            invoice: inv,
            recipient: email,
            subject: `Relance — Facture ${inv.name}`,
            content: `Bonjour,\n\nNous vous rappelons que la facture ${inv.name} d'un montant de ${formatMAD(inv.outstanding_amount)} est arrivée à échéance le ${due} et reste impayée à ce jour.\n\nNous vous remercions de bien vouloir procéder au règlement dans les plus brefs délais.\n\nCordialement,`,
          });
        }
        setBulkProgress(prev => ({ ...prev, sent: prev.sent + 1 }));
        setRelanceCounts(prev => ({ ...prev, [inv.name]: (prev[inv.name] || 0) + 1 }));
      } catch {
        setBulkProgress(prev => ({ ...prev, errors: prev.errors + 1 }));
      }
    }
    toast.success(`${toSend.length} relance${toSend.length > 1 ? 's' : ''} terminée${toSend.length > 1 ? 's' : ''}`);
    setSelected(new Set());
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Relances</h1>
          <p className="mt-1 text-sm text-gray-500">
            {invoices.length} facture{invoices.length > 1 ? 's' : ''} impayée{invoices.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Rechercher (client, n° facture)…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cobilan-500/20 focus:border-cobilan-400 transition" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {DURATION_FILTERS.map(f => (
            <button key={f.value}
              onClick={() => { setDurationFilter(f.value); setSelected(new Set()); }}
              className={`px-3 py-2 text-xs font-medium rounded-xl transition ${
                durationFilter === f.value
                  ? 'bg-cobilan-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-cobilan-50 border border-cobilan-200 rounded-xl">
          <svg className="w-5 h-5 text-cobilan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-cobilan-700">
            {selected.size} facture{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''}
          </span>
          <button onClick={handleBulkSend}
            className="ml-auto px-4 py-2 bg-gradient-to-r from-cobilan-600 to-cobilan-700 text-white text-sm font-semibold rounded-xl hover:from-cobilan-700 hover:to-cobilan-800 shadow-lg shadow-cobilan-500/20 active:scale-[0.98] transition-all">
            Relancer ({selected.size})
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3.5 flex items-start gap-3 text-sm text-red-700">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={search || durationFilter ? 'search' : 'check'}
            title={
              invoices.length === 0
                ? 'Aucune facture en retard'
                : 'Aucun résultat pour ces filtres'
            }
            description={
              invoices.length === 0
                ? 'Toutes les factures sont à jour ou payées.'
                : 'Modifiez vos filtres ou votre recherche.'
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-cobilan-600 focus:ring-cobilan-500" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Facture</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Échéance</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Retard</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total dû</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Relances</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inv => {
                  const d = daysOverdue(inv.due_date);
                  const isOver30 = d > 30;
                  return (
                    <tr key={inv.name}
                      className={`transition-colors hover:bg-gray-50/80 ${
                        isOver30
                          ? 'bg-red-50/40 border-l-4 border-l-red-400'
                          : 'bg-amber-50/30 border-l-4 border-l-amber-400'
                      }`}>
                      <td className="px-4 py-3">
                        <input type="checkbox"
                          checked={selected.has(inv.name)}
                          onChange={() => toggleSelect(inv.name)}
                          className="rounded border-gray-300 text-cobilan-600 focus:ring-cobilan-500" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{inv.customer_name || inv.customer}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/factures-vente/${encodeURIComponent(inv.name)}`}
                          className="font-medium text-cobilan-600 hover:text-cobilan-800">
                          {inv.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isOver30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {d} jour{d > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatMAD(inv.outstanding_amount)}</td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        {(relanceCounts[inv.name] || 0) > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cobilan-100 text-cobilan-700">
                            {relanceCounts[inv.name]}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleSendSingle(inv)}
                          className="px-3 py-1.5 text-xs font-semibold bg-cobilan-600 text-white rounded-xl hover:bg-cobilan-700 transition active:scale-[0.98] shadow-sm">
                          Relancer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RelancePreviewModal
        invoice={previewInvoice}
        open={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        onSend={handleSingleSent}
      />

      <BulkProgressModal
        open={bulkOpen}
        total={bulkProgress.total}
        sent={bulkProgress.sent}
        errors={bulkProgress.errors}
        onClose={() => setBulkOpen(false)}
      />
    </div>
  );
}

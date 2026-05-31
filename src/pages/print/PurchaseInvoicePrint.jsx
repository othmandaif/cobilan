import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import purchaseInvoiceService from '../../api/purchaseInvoices';

function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PurchaseInvoicePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    purchaseInvoiceService.getById(id)
      .then(data => { setInvoice(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (invoice) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [invoice]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-cobilan-600 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Facture introuvable</p>
          <button onClick={() => navigate('/factures-achat')} className="mt-4 text-sm text-cobilan-600 hover:underline">Retour</button>
        </div>
      </div>
    );
  }

  const items = invoice.items || [];
  const taxes = invoice.taxes || [];
  const netTotal = invoice.net_total || 0;
  const totalTaxes = invoice.total_taxes_and_charges || 0;
  const grandTotal = invoice.grand_total || 0;

  return (
    <div className="print-page">
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3 shadow-sm print-hidden">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Aperçu avant impression</span>
          <button onClick={() => window.print()}
            className="px-4 py-2 bg-cobilan-600 text-white text-sm font-semibold rounded-xl hover:bg-cobilan-700 transition flex items-center gap-2 active:scale-[0.98] shadow-lg shadow-cobilan-500/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Imprimer / PDF
          </button>
        </div>
      </div>

      <div className="print-content max-w-[210mm] mx-auto bg-white">
        <div className="flex justify-between items-start pb-6 mb-6 border-b-2 border-gray-200">
          <div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cobilan-600 to-cobilan-800 flex items-center justify-center text-white font-bold text-xl mb-3">
              {invoice.company?.charAt(0) || 'C'}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.company || 'Société'}</h1>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">FACTURE D'ACHAT</h2>
            <p className="text-lg font-semibold text-cobilan-600 mt-1">{invoice.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fournisseur</h3>
            <p className="text-sm font-semibold text-gray-900">{invoice.supplier_name || invoice.supplier}</p>
            {invoice.bill_no && (
              <p className="text-xs text-gray-500 mt-1">N° facture fournisseur : {invoice.bill_no}</p>
            )}
            {invoice.bill_date && (
              <p className="text-xs text-gray-500">Date facture fournisseur : {formatDate(invoice.bill_date)}</p>
            )}
          </div>
          <div className="text-right space-y-1">
            <div className="flex justify-end gap-4 text-sm">
              <span className="text-gray-500">Date d'émission :</span>
              <span className="font-medium text-gray-900">{formatDate(invoice.posting_date)}</span>
            </div>
            <div className="flex justify-end gap-4 text-sm">
              <span className="text-gray-500">Date d'échéance :</span>
              <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-end gap-4 text-sm">
              <span className="text-gray-500">Devise :</span>
              <span className="font-medium text-gray-900">{invoice.currency || 'MAD'}</span>
            </div>
            {invoice.outstanding_amount > 0 && (
              <div className="flex justify-end gap-4 text-sm">
                <span className="text-gray-500">Reste à payer :</span>
                <span className="font-semibold text-orange-600">{formatMAD(invoice.outstanding_amount)} MAD</span>
              </div>
            )}
          </div>
        </div>

        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-2/5">Article</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantité</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix unitaire</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">Aucun article</td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{item.item_name || item.item_code}</p>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                    {item.expense_account && (
                      <p className="text-xs text-amber-600 mt-0.5">Compte : {item.expense_account}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{item.qty}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{formatMAD(item.rate)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatMAD(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total HT</span>
              <span className="text-gray-900">{formatMAD(netTotal)} MAD</span>
            </div>
            {taxes.length > 0 && taxes.map((tax, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{tax.description || tax.account_head} {tax.rate ? `(${tax.rate}%)` : ''}</span>
                <span className="text-gray-900">{formatMAD(tax.tax_amount)} MAD</span>
              </div>
            ))}
            {totalTaxes > 0 && taxes.length === 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Taxes</span>
                <span className="text-gray-900">{formatMAD(totalTaxes)} MAD</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-3 border-t-2 border-gray-300">
              <span>Total TTC</span>
              <span className="text-cobilan-700">{formatMAD(grandTotal)} MAD</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 space-y-0.5 text-center">
          <p>Document généré par CoBilan — {formatDateShort(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  );
}

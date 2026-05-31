import { useState, useRef, useCallback } from 'react';
import { ocrInvoice, getFileAsDataURL } from '../utils/ocr';
import { toast } from './toast';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'application/pdf'];

export default function OcrUploader({ onResult, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  const handleFile = useCallback(async (f) => {
    if (!f || !ACCEPTED_TYPES.includes(f.type)) {
      toast.warning('Format accepté : JPEG, PNG, WebP, TIFF');
      return;
    }
    setFile(f);
    setResult(null);
    setProgress(0);
    const url = await getFileAsDataURL(f);
    setPreview(url);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + Math.random() * 20, 85));
      }, 500);

      const data = await ocrInvoice(file);
      clearInterval(progressInterval);
      setProgress(100);
      setResult(data);

      if (data.confidence < 50) {
        toast.warning('Confiance faible (' + data.confidence + '%) — vérifiez les champs');
      } else {
        toast.success('Texte extrait avec succès');
      }
    } catch (err) {
      toast.error('Erreur OCR : ' + (err.message || ''));
    } finally {
      setProcessing(false);
    }
  };

  const handleApply = () => {
    if (result) onResult(result);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cobilan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5M3.75 4.5l2.25 15h12l2.25-15M3.75 4.5h16.5m-16.5 0l.563-3.375A1.5 1.5 0 015.888 0h12.224a1.5 1.5 0 011.325 1.125L20.25 4.5" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900">Import par OCR</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          {!file && (
            <div ref={dropRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-cobilan-400 hover:bg-cobilan-50/30 transition cursor-pointer">
              <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-500 mb-1">Glissez une image de facture ici</p>
              <p className="text-xs text-gray-400">ou cliquez pour parcourir — JPEG, PNG, WebP, TIFF</p>
            </div>
          )}

          <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')}
            onChange={handleChange} className="hidden" />

          {/* Preview + processing */}
          {preview && !result && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-gray-200 max-h-80 bg-gray-50">
                <img src={preview} alt="Aperçu facture" className="w-full h-full object-contain max-h-80" />
              </div>
              {file && (
                <p className="text-xs text-gray-400 truncate">{file.name} ({(file.size / 1024).toFixed(0)} Ko)</p>
              )}
              <div className="flex gap-2">
                <button onClick={handleProcess} disabled={processing}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cobilan-600 to-cobilan-700 text-white text-sm font-semibold rounded-xl hover:from-cobilan-700 hover:to-cobilan-800 disabled:opacity-50 shadow-lg shadow-cobilan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {processing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyse en cours ({Math.round(progress)}%)
                    </>
                  ) : 'Analyser avec OCR'}
                </button>
                <button onClick={() => { setFile(null); setPreview(''); }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                  Changer
                </button>
              </div>
              {processing && (
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cobilan-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Texte extrait — confiance <strong>{result.confidence}%</strong>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="N° facture" value={result.invoice_number} />
                <Field label="Date" value={result.posting_date} />
                <Field label="Échéance" value={result.due_date} />
                <Field label="Total HT" value={result.total_ht ? `${result.total_ht.toFixed(2)} MAD` : ''} />
                <Field label="TVA" value={result.tva_amount ? `${result.tva_amount.toFixed(2)} MAD` : ''} />
                <Field label="Total TTC" value={result.total_ttc ? `${result.total_ttc.toFixed(2)} MAD` : ''} />
                <Field label="TVA %" value={result.tva_rate ? `${result.tva_rate}%` : ''} />
                <Field label="Fournisseur" value={result.supplier_name} />
                <Field label="Client" value={result.customer_name} />
                <Field label="ICE" value={result.ice} />
                <Field label="IF" value={result.if_} />
                <Field label="Bon cmd" value={result.bill_no} />
              </div>

              {result.items.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Lignes détectées ({result.items.length})
                  </p>
                  <div className="space-y-1">
                    {result.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs px-3 py-1.5 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-gray-900 truncate">{item.item_name}</span>
                        <span className="text-gray-400 w-12 text-right">x{item.qty}</span>
                        <span className="text-gray-600 w-20 text-right">{item.rate.toFixed(2)}</span>
                        <span className="font-medium text-gray-900 w-20 text-right">{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw text */}
              <details>
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                  Texte brut extrait
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {result.rawText}
                </pre>
              </details>

              <div className="flex gap-2 pt-1">
                <button onClick={handleApply}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cobilan-600 to-cobilan-700 text-white text-sm font-semibold rounded-xl hover:from-cobilan-700 hover:to-cobilan-800 shadow-lg shadow-cobilan-500/20 active:scale-[0.98] transition-all">
                  Appliquer au formulaire
                </button>
                <button onClick={() => { setResult(null); setFile(null); setPreview(''); }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                  Nouvelle image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900 truncate">{value || '—'}</p>
    </div>
  );
}

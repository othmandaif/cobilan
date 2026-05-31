import { useState } from 'react';
import apiClient from '../api/client';
import { toast } from './toast';

export default function ExportButton({ doctype, fields, filters = [], filename = 'export.csv' }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        doctype,
        file_format_type: 'CSV',
        fields: JSON.stringify(fields),
        filters: JSON.stringify(filters),
      });
      const res = await fetch(`/api/method/frappe.desk.reportview.export_query?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exporté : ${filename}`);
    } catch {
      toast.error("Échec de l'export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      aria-label="Exporter"
      className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98]"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      )}
      {loading ? 'Export…' : 'Exporter'}
    </button>
  );
}

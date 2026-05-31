export default function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-cobilan-600 hover:bg-cobilan-700'
            }`}
          >
            {confirmLabel || 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}
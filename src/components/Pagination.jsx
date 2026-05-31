export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        {page * limit + 1}–{Math.min((page + 1) * limit, total)} sur {total}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Précédent
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
